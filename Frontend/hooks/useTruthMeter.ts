'use client';

import { useEffect, useRef, useState } from 'react';
import { syncAnalysis, type SyncAnalysisResult } from '@/app/actions/sync-analysis';
import { pushInterviewSyncResult } from '@/lib/state/interview-client-store';

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

interface UseTruthMeterOptions {
  enabled: boolean;
  githubAuditContext: unknown;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onSyncResult?: (result: SyncAnalysisResult) => void;
  onListeningChange?: (active: boolean) => void;
}

export function useTruthMeter({
  enabled,
  githubAuditContext,
  localStream,
  remoteStream,
  onSyncResult,
  onListeningChange,
}: UseTruthMeterOptions): { isListening: boolean } {
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const transcriptBufferRef = useRef<string>('');
  const shouldListenRef = useRef<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteLevelRef = useRef<number>(0);

  useEffect(() => {
    const win = window as SpeechWindow;
    const SpeechRecognitionCtor = win.webkitSpeechRecognition || win.SpeechRecognition;
    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalChunk += `${event.results[i][0].transcript} `;
        }
      }

      if (finalChunk.trim().length > 0) {
        transcriptBufferRef.current += finalChunk;
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
      if (shouldListenRef.current) {
        try {
          recognition.start();
          setIsListening(true);
          onListeningChange?.(true);
        } catch {
          // ignore duplicate starts
        }
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.stop();
      } catch {
        // ignore stop errors
      }
    };
  }, [onListeningChange]);

  useEffect(() => {
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    audioContextRef.current = context;
    mixedDestinationRef.current = destination;

    return () => {
      remoteAnalyserRef.current = null;
      void context.close();
      audioContextRef.current = null;
      mixedDestinationRef.current = null;
    };
  }, []);

  useEffect(() => {
    const context = audioContextRef.current;
    const destination = mixedDestinationRef.current;
    if (!context || !destination) {
      return;
    }

    if (localStream) {
      const localSource = context.createMediaStreamSource(localStream);
      localSource.connect(destination);
    }

    if (remoteStream) {
      const remoteSource = context.createMediaStreamSource(remoteStream);
      remoteSource.connect(destination);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      remoteSource.connect(analyser);
      remoteAnalyserRef.current = analyser;
    }
  }, [localStream, remoteStream]);

  useEffect(() => {
    let rafId = 0;
    const analyser = remoteAnalyserRef.current;
    if (!analyser) {
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) {
        sum += Math.abs(v - 128);
      }
      remoteLevelRef.current = sum / data.length;
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => cancelAnimationFrame(rafId);
  }, [remoteStream]);

  useEffect(() => {
    shouldListenRef.current = enabled;
    if (!recognitionRef.current) {
      return;
    }

    if (enabled) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        onListeningChange?.(true);
      } catch {
        // ignore duplicate starts
      }
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch {
      // ignore stop errors
    }
    setIsListening(false);
    onListeningChange?.(false);
  }, [enabled, onListeningChange]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const transcript = transcriptBufferRef.current.trim();
      const remoteTalking = remoteLevelRef.current > 8;

      if (!transcript && !remoteTalking) {
        return;
      }

      transcriptBufferRef.current = '';
      const payload = transcript || 'Remote participant speaking.';

      try {
        const result = await syncAnalysis(payload, githubAuditContext);
        pushInterviewSyncResult(result);
        onSyncResult?.(result);
      } catch (error) {
        console.error('Truth meter sync failed:', error);
      }
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [enabled, githubAuditContext, onSyncResult]);

  return { isListening };
}
