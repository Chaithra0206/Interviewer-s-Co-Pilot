'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Peer, { type MediaConnection } from 'peerjs';
import type { SyncAnalysisResult } from '@/app/actions/sync-analysis';
import { useTruthMeter } from '@/hooks/useTruthMeter';

type VoiceMode = 'interviewer' | 'candidate';
type VoiceConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

interface VoicePeerProps {
  mode: VoiceMode;
  initialInterviewerId?: string;
  githubAuditContext: unknown;
  micEnabled: boolean;
  remotePeerId?: string;
  onRemotePeerIdChange?: (id: string) => void;
  connectNowSignal?: number;
  showInlineCandidateControls?: boolean;
  onPeerId?: (id: string) => void;
  onConnectionStateChange?: (state: VoiceConnectionState) => void;
  onSyncResult?: (result: SyncAnalysisResult) => void;
  onListeningChange?: (active: boolean) => void;
}

export default function VoicePeer({
  mode,
  initialInterviewerId = '',
  githubAuditContext,
  micEnabled,
  remotePeerId,
  onRemotePeerIdChange,
  connectNowSignal = 0,
  showInlineCandidateControls = true,
  onPeerId,
  onConnectionStateChange,
  onSyncResult,
  onListeningChange,
}: VoicePeerProps) {
  const [myId, setMyId] = useState('');
  const [remoteId, setRemoteId] = useState(initialInterviewerId);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('connecting');
  const [micPermission, setMicPermission] = useState<'unknown' | 'requesting' | 'granted' | 'denied'>('unknown');

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);

  const isInterviewer = mode === 'interviewer';
  const targetPeerId = (remotePeerId ?? remoteId).trim();
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : true;

  useEffect(() => {
    onConnectionStateChange?.(connectionState);
  }, [connectionState, onConnectionStateChange]);

  const getLocalStream = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }
    setMicPermission('requesting');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStreamState(stream);
    setMicPermission('granted');
    return stream;
  }, []);

  const requestMicrophone = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await getLocalStream();
    } catch {
      setMicPermission('denied');
      setError('Microphone permission denied. Allow mic access and retry.');
    }
  }, [getLocalStream]);

  const attachRemoteStream = useCallback((stream: MediaStream): void => {
    remoteStreamRef.current = stream;
    setRemoteStreamState(stream);
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      void audioRef.current.play().catch(() => {
        setError('Remote audio is blocked by autoplay policy. Click anywhere and retry.');
      });
    }
    setConnected(true);
    setConnectionState('connected');
  }, []);

  const bindCallEvents = useCallback((call: MediaConnection): void => {
    callRef.current = call;

    call.on('stream', (remoteStream) => {
      attachRemoteStream(remoteStream);
    });

    call.on('close', () => {
      console.log('[VoicePeer] Call Event: close');
      setConnected(false);
      setConnectionState('disconnected');
      remoteStreamRef.current = null;
      setRemoteStreamState(null);
    });

    call.on('error', (err) => {
      console.error('[VoicePeer] Call Event: error', err);
      setConnected(false);
      setConnectionState('failed');
      setError(`Peer media call failed: ${err.type}`);
    });
  }, [attachRemoteStream]);

  const startCall = useCallback(async (): Promise<void> => {
    const peer = peerRef.current;
    if (!peer) {
      return;
    }
    const target = targetPeerId;
    if (!target) {
      setError('Interviewer ID is required.');
      return;
    }
    if (target.startsWith('architectural-scout-')) {
      setError('Invalid target: this is a room code, not a Peer ID. Paste the interviewer Peer ID.');
      return;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      const local = await getLocalStream();
      const call = peer.call(target, local);
      bindCallEvents(call);
    } catch {
      setConnectionState('failed');
      setError('Could not start audio call.');
    }
  }, [targetPeerId, getLocalStream, bindCallEvents]);

  useEffect(() => {
    if (mode !== 'candidate') {
      return;
    }
    if (connectNowSignal <= 0) {
      return;
    }
    void startCall();
  }, [connectNowSignal, mode, startCall]);

  useEffect(() => {
    const peer = new Peer();

    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log(`[VoicePeer] Peer opened with ID: ${id}`);
      setMyId(id);
      onPeerId?.(id);
      setConnectionState('idle');
    });

    peer.on('call', async (call) => {
      try {
        const local = await getLocalStream();
        call.answer(local);
        setConnectionState('connecting');
        bindCallEvents(call);
      } catch {
        setConnectionState('failed');
        setError('Microphone access was denied.');
      }
    });

    peer.on('error', (err) => {
      console.error('[VoicePeer] Peer Event: error', err);
      setConnectionState('failed');
      if (err.type === 'unavailable-id') {
        setError('Connection ID is already in use. Please refresh or try a new room.');
      } else {
        setError(`Peer signaling failed: ${err.type}`);
      }
    });

    peer.on('disconnected', () => {
      console.log('[VoicePeer] Peer Event: disconnected');
      setConnectionState('disconnected');
      setConnected(false);
    });

    return () => {
      callRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
      peer.destroy();
    };
  }, [getLocalStream, bindCallEvents, onPeerId]);

  useEffect(() => {
    if (!isSecureContext) {
      setTimeout(() => {
        setError('Microphone requires HTTPS or localhost secure context.');
        setMicPermission('denied');
      }, 0);
      return;
    }

    void requestMicrophone();
  }, [isSecureContext, requestMicrophone]);

  useEffect(() => {
    const localStream = localStreamRef.current;
    if (!localStream) {
      return;
    }
    for (const track of localStream.getAudioTracks()) {
      track.enabled = micEnabled;
    }
  }, [micEnabled]);

  const { isListening } = useTruthMeter({
    enabled: connected && micEnabled,
    githubAuditContext,
    localStream: localStreamState,
    remoteStream: remoteStreamState,
    onSyncResult,
    onListeningChange,
  });

  const waveformBars = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <div className="h-full w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold tracking-widest text-emerald-400">SECURE AUDIO LINK</h3>
        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${isListening ? 'bg-emerald-500/20 text-emerald-300 animate-pulse' : 'bg-zinc-700 text-zinc-300'}`}>
          Intelligence LIVE
        </span>
      </div>

      <p className="mb-2 text-[11px] text-zinc-400">
        Your ID: <span className="font-mono text-zinc-100">{myId || 'Generating...'}</span>
        {isInterviewer && myId && (
          <button 
            onClick={() => {
              navigator.clipboard.writeText(myId);
              // Simple feedback would be nice here but keeping it minimal
            }}
            className="ml-2 text-[10px] text-emerald-500 hover:text-emerald-400"
          >
            (Copy)
          </button>
        )}
      </p>

      <div className="mb-3 flex items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-400">Mic</span>
        <span className={`text-[10px] font-semibold uppercase tracking-widest ${micPermission === 'granted' ? 'text-emerald-400' : micPermission === 'denied' ? 'text-red-400' : 'text-amber-400'}`}>
          {micPermission}
        </span>
        {micPermission !== 'granted' && (
          <button
            type="button"
            onClick={() => void requestMicrophone()}
            className="rounded bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-200 hover:bg-zinc-700"
          >
            Enable Mic
          </button>
        )}
      </div>

      {!isInterviewer && !connected && showInlineCandidateControls && (
        <div className="mb-3 flex gap-2">
          <input
            value={targetPeerId}
            onChange={(event) => {
              if (onRemotePeerIdChange) {
                onRemotePeerIdChange(event.target.value);
                return;
              }
              setRemoteId(event.target.value);
            }}
            className="flex-1 rounded-md border border-zinc-600 bg-black px-2 py-2 text-xs text-white outline-none focus:border-emerald-400"
            placeholder="Enter Interviewer ID"
          />
          <button
            type="button"
            onClick={startCall}
            disabled={micPermission !== 'granted' || !myId}
            className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Connect
          </button>
        </div>
      )}

      {isInterviewer && (
        <p className="mb-3 text-[11px] text-zinc-400">Share your Peer ID with the candidate, then wait for incoming call...</p>
      )}

      {connected && (
        <p className="mb-3 text-xs font-semibold text-emerald-400 animate-pulse">LIVE AUDIO SYNC ACTIVE</p>
      )}

      {error && (
        <p className="mb-3 text-xs text-red-400">{error}</p>
      )}

      <div className="mb-2 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
        <div className="flex h-16 items-end justify-between gap-1">
          {waveformBars.map((bar) => (
            <span
              key={bar}
              className="w-1.5 rounded-sm bg-emerald-400/70 animate-pulse"
              style={{
                height: `${25 + ((bar * 13) % 60)}%`,
                animationDelay: `${bar * 0.08}s`,
              }}
            />
          ))}
        </div>
      </div>

      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {connectionState === 'connected' ? 'Forensic Audio Waveform Active' : 'Awaiting Encrypted Peer Sync'}
      </p>

      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
}
