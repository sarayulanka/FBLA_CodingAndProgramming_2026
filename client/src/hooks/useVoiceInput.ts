/**
 * useVoiceInput — cross-environment voice transcription hook.
 *
 * Strategy:
 *  1. If Web Speech API is available AND we're in a secure context (HTTPS / localhost)
 *     → use it directly (instant, no server round-trip)
 *  2. Otherwise → record PCM audio with AudioContext + MediaRecorder fallback,
 *     send to the AWS Transcribe Streaming endpoint on the server.
 *
 * The fallback works on any http:// URL (including local-network IPs like 192.168.x.x)
 * as long as the server can reach AWS.
 */

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type VoiceInputOptions = {
  onResult: (text: string) => void;
  onSearch?: () => void; // optional: called right after result is set
};

export function useVoiceInput({ onResult, onSearch }: VoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcribeMutation = trpc.ai.transcribeAudio.useMutation();

  const canUseNative = (): boolean => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SR && window.isSecureContext;
  };

  /** Native Web Speech API path (HTTPS / localhost) */
  const startNative = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      const msg =
        e.error === "not-allowed" ? "Microphone access denied — check your browser permissions." :
        e.error === "network" ? "Network error — check your connection." :
        "Couldn't hear that — try again.";
      toast.error(msg);
    };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
      if (onSearch) setTimeout(onSearch, 100);
    };
    recognition.start();
  };

  /** AWS Transcribe fallback path (any HTTP context) */
  const startFallback = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone not available in this browser.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone access denied — check your browser permissions.");
      return;
    }

    setIsListening(true);
    toast("Listening…", { duration: 3000 });

    // Capture raw PCM via AudioContext → 16kHz mono Int16
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    const chunks: Int16Array[] = [];

    processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
      }
      chunks.push(int16);
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);

    // Record for up to 6 seconds, then auto-stop
    await new Promise<void>((resolve) => setTimeout(resolve, 6000));

    processor.disconnect();
    source.disconnect();
    audioCtx.close();
    stream.getTracks().forEach(t => t.stop());
    setIsListening(false);

    // Flatten all chunks into a single Int16 buffer
    const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Int16Array(totalLen);
    let offset = 0;
    for (const c of chunks) { merged.set(c, offset); offset += c.length; }

    // Convert Int16Array → base64 without Node Buffer (browser env)
    const uint8 = new Uint8Array(merged.buffer);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    const audioBase64 = btoa(binary);

    try {
      const { transcript } = await transcribeMutation.mutateAsync({ audioBase64});
      if (!transcript) { toast.error("Couldn't make out what you said — try again."); return; }
      onResult(transcript);
      if (onSearch) setTimeout(onSearch, 100);
    } catch {
      toast.error("Transcription failed — try again.");
    }
  };

  const toggle = () => {
    if (isListening) {
      // Stop whatever is running
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (canUseNative()) {
      startNative();
    } else {
      startFallback();
    }
  };

  return { isListening, toggle };
}
