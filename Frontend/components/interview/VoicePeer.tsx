'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Peer, { type MediaConnection } from 'peerjs';
import { syncAnalysis, type SyncAnalysisResult } from '@/app/actions/sync-analysis';
import { pushInterviewSyncResult } from '@/lib/state/interview-client-store';

type VoiceMode = 'interviewer' | 'candidate';
type VoiceConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

interface VoicePeerProps {
  mode: VoiceMode;
  initialInterviewerId?: string;
  forensicContext: unknown;
  githubRepoData?: unknown;
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

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
  onerror: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

export default function VoicePeer({
  mode,
  initialInterviewerId = '',
  forensicContext,
  githubRepoData,
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('connecting');
  const [micPermission, setMicPermission] = useState<'unknown' | 'requesting' | 'granted' | 'denied'>('unknown');

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const transcriptBufferRef = useRef('');
  const isAnalyzingRef = useRef(false);
  const speechRestartTimeoutRef = useRef<number | null>(null);
  const remoteSpeakingRef = useRef(false);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAudioContextRef = useRef<AudioContext | null>(null);
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

  const runSyncAnalysis = useCallback(async (payload: string): Promise<void> => {
    if (!payload.trim()) {
      return;
    }
    if (isAnalyzingRef.current) {
      return;
    }

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    onListeningChange?.(true);
    console.log('[Forensic][TruthMeter] Sync start:', payload.slice(0, 140));
    try {
      const result = await syncAnalysis(payload, forensicContext, githubRepoData ?? null);
      pushInterviewSyncResult(result);
      onSyncResult?.(result);
      console.log('[Forensic][TruthMeter] Sync result:', result.alert ?? 'no-alert');
    } catch (syncError) {
      console.error('[Forensic][TruthMeter] Sync failed:', syncError);
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
      onListeningChange?.(false);
    }
  }, [forensicContext, githubRepoData, onListeningChange, onSyncResult]);

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
    const context = new AudioContext();
    remoteAudioContextRef.current = context;
    return () => {
      void context.close();
      remoteAudioContextRef.current = null;
      remoteAnalyserRef.current = null;
    };
  }, []);

  useEffect(() => {
    const context = remoteAudioContextRef.current;
    if (!context || !remoteStreamState) {
      remoteAnalyserRef.current = null;
      return;
    }

    const source = context.createMediaStreamSource(remoteStreamState);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    remoteAnalyserRef.current = analyser;

    const samples = new Uint8Array(analyser.frequencyBinCount);
    let rafId = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(samples);
      let signal = 0;
      for (const value of samples) {
        signal += Math.abs(value - 128);
      }
      remoteSpeakingRef.current = signal / samples.length > 9;
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      source.disconnect();
      analyser.disconnect();
      remoteSpeakingRef.current = false;
    };
  }, [remoteStreamState]);

  useEffect(() => {
    const win = window as SpeechWindow;
    const SpeechCtor = win.webkitSpeechRecognition || win.SpeechRecognition;
    if (!SpeechCtor) {
      console.warn('[Forensic][TruthMeter] SpeechRecognition unavailable in this browser.');
      return;
    }

    const recognition = new SpeechCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalChunk += `${event.results[i][0].transcript} `;
        }
      }
      if (remoteSpeakingRef.current) {
        finalChunk += '[Peer remote audio active] ';
      }
      if (!finalChunk.trim()) {
        return;
      }

      transcriptBufferRef.current += finalChunk;
      console.log('[Forensic][TruthMeter] Buffer size:', transcriptBufferRef.current.length);
      if (transcriptBufferRef.current.length >= 100) {
        const payload = transcriptBufferRef.current.trim();
        transcriptBufferRef.current = '';
        void runSyncAnalysis(payload);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (shouldListenRef.current) {
        console.log('[Forensic][TruthMeter] Speech ended, restarting...');
        speechRestartTimeoutRef.current = window.setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            // ignore duplicate starts
          }
        }, 50);
      }
    };

    recognition.onerror = () => {
      console.warn('[Forensic][TruthMeter] Speech error, forcing restart.');
      setIsListening(false);
      if (shouldListenRef.current) {
        speechRestartTimeoutRef.current = window.setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            // ignore duplicate starts
          }
        }, 50);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      shouldListenRef.current = false;
      if (speechRestartTimeoutRef.current !== null) {
        window.clearTimeout(speechRestartTimeoutRef.current);
      }
      try {
        recognition.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
    };
  }, [runSyncAnalysis]);

  useEffect(() => {
    const shouldRun = connected && micEnabled;
    shouldListenRef.current = shouldRun;
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    if (shouldRun) {
      console.log('[Forensic][TruthMeter] Activating speech listener.');
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        // ignore duplicate starts
      }
      return;
    }

    console.log('[Forensic][TruthMeter] Stopping speech listener.');
    transcriptBufferRef.current = '';
    try {
      recognition.stop();
    } catch {
      // ignore stop errors
    }
    setIsListening(false);
  }, [connected, micEnabled]);

  useEffect(() => {
    const localStream = localStreamRef.current;
    if (!localStream) {
      return;
    }
    for (const track of localStream.getAudioTracks()) {
      track.enabled = micEnabled;
    }
  }, [micEnabled]);

  const waveformBars = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <div className="h-full w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold tracking-widest text-emerald-400">SECURE AUDIO LINK</h3>
        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${(isAnalyzing || isListening) ? 'bg-emerald-500/20 text-emerald-300 animate-pulse' : 'bg-zinc-700 text-zinc-300'}`}>
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
