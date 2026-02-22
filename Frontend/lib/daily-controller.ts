import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { useEffect, useState, useCallback, useRef } from "react";

export function useDailyController(roomUrl: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "connected" | "disconnected" | "failed"
  >("idle");

  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

    let isCancelled = false;
    let frame: DailyCall | null = null;

    const initFrame = async () => {
      // Hardware bypass for mock URLs - avoid hitting Daily's servers and billing entirely
      if (roomUrl.includes("interview-like-pro.daily.co/architectural-scout")) {
        setConnectionState("connected");
        return;
      }

      // Await destruction of existing globally tracked frame if it exists (Strict Mode workaround)
      const existingFrame = DailyIframe.getCallInstance();
      if (existingFrame) {
        await existingFrame.destroy();
      }

      if (isCancelled || !containerRef.current) return;

      setTimeout(() => {
        if (!isCancelled) setConnectionState("connecting");
      }, 0);

      const frameOpts: any = {
        layout: "custom-v1",
        showLeaveButton: false,
        showFullscreenButton: false,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: "16px",
          backgroundColor: "transparent",
        },
      };

      try {
        frame = DailyIframe.createFrame(containerRef.current, frameOpts);
        if (isCancelled) {
          frame.destroy();
          return;
        }

        setCallObject(frame);

        // Event listeners
        frame.on("joined-meeting", () => setConnectionState("connected"));
        frame.on("left-meeting", () => setConnectionState("disconnected"));
        frame.on("error", (err) => {
          console.error("Daily Iframe Error:", err);
          setConnectionState("failed");
        });
        frame.on("camera-error", (err) => console.error("Camera Error:", err));

        frame.on("local-screen-share-started", () => setIsScreenSharing(true));
        frame.on("local-screen-share-stopped", () => setIsScreenSharing(false));

        // Join the meeting
        await frame.join({ url: roomUrl });
      } catch (err) {
        console.error("Failed to initialize Daily iframe:", err);
        if (!isCancelled) setConnectionState("failed");
      }
    };

    initFrame();

    return () => {
      isCancelled = true;
      if (roomUrl.includes("interview-like-pro.daily.co/architectural-scout")) return;
      
      if (frame) {
        frame.destroy();
      } else {
        const globalFrame = DailyIframe.getCallInstance();
        if (globalFrame) {
          globalFrame.destroy();
        }
      }
    };
  }, [roomUrl]);

  const toggleAudio = useCallback(() => {
    if (!callObject) return;
    const current = callObject.localAudio();
    callObject.setLocalAudio(!current);
    setIsMicOn(!current);
  }, [callObject]);

  const toggleVideo = useCallback(() => {
    if (!callObject) return;
    const current = callObject.localVideo();
    callObject.setLocalVideo(!current);
    setIsCameraOn(!current);
  }, [callObject]);

  const toggleScreenShare = useCallback(async () => {
    if (!callObject) return;
    if (isScreenSharing) {
      callObject.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      await callObject.startScreenShare();
      setIsScreenSharing(true);
    }
  }, [callObject, isScreenSharing]);

  const leaveCall = useCallback(() => {
    if (!callObject) return;
    callObject.leave();
  }, [callObject]);

  return {
    containerRef,
    connectionState,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveCall,
  };
}
