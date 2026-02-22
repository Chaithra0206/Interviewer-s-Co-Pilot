'use client';
import React, { useState, useCallback, useRef, useEffect } from "react";
import { JitsiMeeting } from '@jitsi/react-sdk';

interface JitsiPayload {
  muted?: boolean;
  on?: boolean;
}

interface IJitsiApi {
  addEventListener: (event: string, handler: (payload: JitsiPayload) => void) => void;
  executeCommand: (command: string) => void;
}

export interface JitsiControllerReturn {
  JitsiNode: React.ReactNode;
  connectionState: "idle" | "connecting" | "connected" | "disconnected" | "failed";
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  leaveCall: () => void;
}

function sanitizeRoomSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeRoomName(raw: string): string {
  const fallback = "architectural-scout";
  if (!raw || raw.trim().length === 0) return fallback;

  const tryDecode = (input: string): string => {
    try {
      return decodeURIComponent(input);
    } catch {
      return input;
    }
  };

  let value = tryDecode(raw.trim());

  // If user pasted our own invite URL, extract ?room= first.
  try {
    const url = new URL(value);
    const nestedRoom = url.searchParams.get("room") || url.searchParams.get("code");
    if (nestedRoom) {
      value = tryDecode(nestedRoom);
    } else {
      const segments = url.pathname.split("/").filter(Boolean);
      value = segments.at(-1) || value;
    }
  } catch {
    // not a URL, continue
  }

  // If still looks like query payload, strip it.
  value = value.split("?")[0].split("#")[0];

  // If still slash-delimited, take last segment.
  const parts = value.split("/").filter(Boolean);
  const candidate = parts.at(-1) || value;
  const slug = sanitizeRoomSlug(candidate);

  return slug || fallback;
}

export function useJitsiController(roomName: string): JitsiControllerReturn {
  const apiRef = useRef<IJitsiApi | null>(null);
  const normalizedRoomName = normalizeRoomName(roomName);
  const [isMounted, setIsMounted] = useState(false);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "connected" | "disconnected" | "failed"
  >("connecting");

  const toggleAudio = useCallback(() => {
    if (!apiRef.current) return;
    apiRef.current.executeCommand("toggleAudio");
  }, []);

  const toggleVideo = useCallback(() => {
    if (!apiRef.current) return;
    apiRef.current.executeCommand("toggleVideo");
  }, []);

  const toggleScreenShare = useCallback(() => {
    if (!apiRef.current) return;
    apiRef.current.executeCommand("toggleShareScreen");
  }, []);

  const leaveCall = useCallback(() => {
    if (!apiRef.current) return;
    apiRef.current.executeCommand("hangup");
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const JitsiNode = isMounted && normalizedRoomName ? (
    <JitsiMeeting
      domain="meet.jit.si"
      roomName={normalizedRoomName}
      configOverwrite={{
        startWithAudioMuted: false,
        startWithVideoMuted: true,
        disableModeratorIndicator: true,
        startScreenSharing: false,
        enableEmailInStats: false,
        prejoinPageEnabled: false,
        startAudioOnly: true,
        videoEnable: false,
      }}
      interfaceConfigOverwrite={{
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
        TOOLBAR_BUTTONS: ['microphone', 'hangup', 'chat'],
      }}
      userInfo={{
        displayName: "Candidate",
        email: "candidate@interview.app"
      }}
      getIFrameRef={(iframeRef) => { 
        iframeRef.style.height = '100%';
        iframeRef.style.width = '100%';
        iframeRef.style.border = 'none';
      }}
      onApiReady={(externalApi) => {
        console.log("[Jitsi] onApiReady triggered | room:", normalizedRoomName);
        const api = externalApi as unknown as IJitsiApi;
        apiRef.current = api;
        api.addEventListener("videoConferenceJoined", () => {
          console.log("[Jitsi] videoConferenceJoined triggered");
          setConnectionState("connected");
        });

        api.addEventListener("videoConferenceLeft", () => {
          console.log("[Jitsi] videoConferenceLeft triggered");
          setConnectionState("disconnected");
        });

        api.addEventListener("audioMuteStatusChanged", (payload: JitsiPayload) => {
          setIsMicOn(!payload.muted);
        });

        api.addEventListener("videoMuteStatusChanged", (payload: JitsiPayload) => {
          setIsCameraOn(!payload.muted);
        });

        api.addEventListener("screenSharingStatusChanged", (payload: JitsiPayload) => {
          setIsScreenSharing(!!payload.on);
        });
      }}
      onReadyToClose={() => {
        setConnectionState("disconnected");
      }}
    />
  ) : null;

  return {
    JitsiNode,
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
