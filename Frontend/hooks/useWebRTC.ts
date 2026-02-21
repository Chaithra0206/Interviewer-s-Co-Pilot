/**
 * useWebRTC — Full WebRTC media hook with signaling.
 *
 * Handles getUserMedia, RTCPeerConnection, offer/answer negotiation,
 * ICE candidate exchange, mute/camera/screen-share controls.
 *
 * Cross-browser: Chrome, Firefox, Opera, Edge, Android.
 * Platforms: Linux, Mac, Windows.
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ConnectionState =
    | "idle"
    | "connecting"
    | "connected"
    | "disconnected"
    | "failed";

export interface UseWebRTCReturn {
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
    connectionState: ConnectionState;
    isMicOn: boolean;
    isCameraOn: boolean;
    isScreenSharing: boolean;
    toggleMic: () => void;
    toggleCamera: () => void;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => void;
    hangUp: () => void;
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const SIGNALING_URL =
    typeof window !== "undefined"
        ? `ws://${window.location.hostname}:8081`
        : "ws://localhost:8081";

const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useWebRTC(roomId: string): UseWebRTCReturn {
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const cameraTrackRef = useRef<MediaStreamTrack | null>(null);

    const [connectionState, setConnectionState] =
        useState<ConnectionState>("idle");
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    /* ---------- main init ---------- */

    useEffect(() => {
        if (!roomId) return;

        let disposed = false;
        let pc: RTCPeerConnection | null = null;
        let ws: WebSocket | null = null;

        /* --- helper: send signaling message --- */
        function sendSignal(msg: Record<string, unknown>) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(msg));
            }
        }

        /* --- helper: create peer connection --- */
        function createPeerConnection() {
            const peerConn = new RTCPeerConnection({ iceServers: ICE_SERVERS });

            peerConn.onicecandidate = (e) => {
                if (e.candidate) {
                    sendSignal({ type: "ice-candidate", candidate: e.candidate });
                }
            };

            peerConn.ontrack = (e) => {
                console.log("[WebRTC] ontrack fired, streams:", e.streams.length);
                if (remoteVideoRef.current && e.streams[0]) {
                    remoteVideoRef.current.srcObject = e.streams[0];
                }
            };

            peerConn.onconnectionstatechange = () => {
                const state = peerConn.connectionState;
                console.log("[WebRTC] Connection state:", state);
                if (state === "connected") setConnectionState("connected");
                else if (state === "disconnected") setConnectionState("disconnected");
                else if (state === "failed") setConnectionState("failed");
                else if (state === "connecting") setConnectionState("connecting");
            };

            peerConn.oniceconnectionstatechange = () => {
                console.log("[WebRTC] ICE state:", peerConn.iceConnectionState);
                if (peerConn.iceConnectionState === "failed") {
                    peerConn.restartIce();
                }
            };

            return peerConn;
        }

        /* --- helper: create and send offer --- */
        async function createOffer() {
            if (!pc) return;
            try {
                setConnectionState("connecting");
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendSignal({ type: "offer", sdp: offer });
                console.log("[WebRTC] Sent offer");
            } catch (err) {
                console.error("[WebRTC] Failed to create offer:", err);
            }
        }

        async function init() {
            // 1. Create peer connection FIRST (so it's ready to receive)
            pc = createPeerConnection();
            pcRef.current = pc;

            // 2. Try to capture local media (may fail if no camera/mic — that's OK)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                if (disposed) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                localStreamRef.current = stream;
                cameraTrackRef.current = stream.getVideoTracks()[0] || null;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Add local tracks to peer connection
                stream.getTracks().forEach((track) => {
                    pc!.addTrack(track, stream);
                });
                console.log("[WebRTC] Local media captured, tracks added to PC");
            } catch (err) {
                console.warn("[WebRTC] getUserMedia failed:", err);
                // Even without local media, we can still receive remote streams.
                // Add a transceiver so the peer connection can receive video/audio.
                pc.addTransceiver("video", { direction: "recvonly" });
                pc.addTransceiver("audio", { direction: "recvonly" });
                console.log("[WebRTC] Added recvonly transceivers for remote media");
            }

            // 3. Connect to signaling server
            ws = new WebSocket(SIGNALING_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("[WebRTC] Signaling connected, joining room:", roomId);
                ws!.send(JSON.stringify({ type: "join", roomId }));
            };

            ws.onmessage = async (event) => {
                let msg: Record<string, unknown>;
                try {
                    msg = JSON.parse(event.data as string);
                } catch {
                    return;
                }

                console.log("[WebRTC] Received signal:", msg.type);

                switch (msg.type) {
                    case "create-offer": {
                        // Server tells us (the new joiner) to create the offer
                        await createOffer();
                        break;
                    }

                    case "offer": {
                        // We received an offer — we are the existing peer. Create answer.
                        const sdp = msg.sdp as RTCSessionDescriptionInit;
                        try {
                            await pc!.setRemoteDescription(new RTCSessionDescription(sdp));
                            const answer = await pc!.createAnswer();
                            await pc!.setLocalDescription(answer);
                            sendSignal({ type: "answer", sdp: answer });
                            setConnectionState("connecting");
                            console.log("[WebRTC] Sent answer");
                        } catch (err) {
                            console.error("[WebRTC] Failed to handle offer:", err);
                        }
                        break;
                    }

                    case "answer": {
                        const sdp = msg.sdp as RTCSessionDescriptionInit;
                        try {
                            await pc!.setRemoteDescription(new RTCSessionDescription(sdp));
                            console.log("[WebRTC] Remote description set (answer)");
                        } catch (err) {
                            console.error("[WebRTC] Failed to set answer:", err);
                        }
                        break;
                    }

                    case "ice-candidate": {
                        const candidate = msg.candidate as RTCIceCandidateInit;
                        try {
                            await pc!.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (err) {
                            console.warn("[WebRTC] Failed to add ICE candidate:", err);
                        }
                        break;
                    }

                    case "peer-left": {
                        setConnectionState("disconnected");
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = null;
                        }
                        break;
                    }
                }
            };

            ws.onclose = () => {
                if (!disposed) {
                    console.log("[WebRTC] Signaling connection closed");
                }
            };

            ws.onerror = (err) => {
                console.error("[WebRTC] Signaling error:", err);
            };
        }

        init();

        return () => {
            disposed = true;

            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            pc?.close();
            pcRef.current = null;

            if (ws && ws.readyState !== WebSocket.CLOSED) {
                ws.send(JSON.stringify({ type: "hang-up" }));
                ws.close();
            }
            wsRef.current = null;

            setConnectionState("idle");
        };
        // roomId is the only external dependency — hook re-inits on room change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    /* ---------- controls ---------- */

    const toggleMic = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMicOn(audioTrack.enabled);
        }
    }, []);

    const toggleCamera = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOn(videoTrack.enabled);
        }
    }, []);

    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
            });
            const screenTrack = screenStream.getVideoTracks()[0];

            // Replace the video track in the peer connection
            const pc = pcRef.current;
            if (pc) {
                const sender = pc
                    .getSenders()
                    .find((s) => s.track?.kind === "video");
                if (sender) {
                    await sender.replaceTrack(screenTrack);
                }
            }

            // Update local preview
            if (localVideoRef.current && localStreamRef.current) {
                const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
                if (oldVideoTrack) {
                    localStreamRef.current.removeTrack(oldVideoTrack);
                }
                localStreamRef.current.addTrack(screenTrack);
                localVideoRef.current.srcObject = localStreamRef.current;
            }

            setIsScreenSharing(true);

            // When user stops sharing via browser UI
            screenTrack.onended = () => {
                stopScreenShare();
            };
        } catch (err) {
            console.warn("[WebRTC] Screen share failed:", err);
        }
    }, []);

    const stopScreenShare = useCallback(() => {
        const camTrack = cameraTrackRef.current;
        if (!camTrack) return;

        const pc = pcRef.current;
        if (pc) {
            const sender = pc
                .getSenders()
                .find((s) => s.track?.kind === "video");
            if (sender) {
                sender.replaceTrack(camTrack);
            }
        }

        if (localStreamRef.current) {
            const screenTrack = localStreamRef.current.getVideoTracks()[0];
            if (screenTrack && screenTrack !== camTrack) {
                screenTrack.stop();
                localStreamRef.current.removeTrack(screenTrack);
            }
            localStreamRef.current.addTrack(camTrack);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
        }

        setIsScreenSharing(false);
    }, []);

    const hangUp = useCallback(() => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "hang-up" }));
        }

        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        pcRef.current?.close();
        pcRef.current = null;

        if (ws && ws.readyState !== WebSocket.CLOSED) {
            ws.close();
        }
        wsRef.current = null;

        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

        setConnectionState("disconnected");
    }, []);

    return {
        localVideoRef,
        remoteVideoRef,
        connectionState,
        isMicOn,
        isCameraOn,
        isScreenSharing,
        toggleMic,
        toggleCamera,
        startScreenShare,
        stopScreenShare,
        hangUp,
    };
}
