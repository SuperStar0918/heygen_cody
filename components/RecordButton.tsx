"use client";

import { useRef, useState } from "react";
import {
  SpeechRecognizer,
  AudioConfig,
  SpeechConfig,
  ResultReason,
} from "microsoft-cognitiveservices-speech-sdk"; 
import { getTokenOrRefresh } from "@/app/lib/token_utils";
interface Props {
  language?: string;
  onTranscript: (finalText: string) => void;
  onInterim?: (text: string) => void;
  onStatusChange?: (status: string) => void;
  className?: string;
}

export default function RecordButton({
  language = "en-US",
  onTranscript,
  onInterim,
  onStatusChange,
  className = "",
}: Props) {
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const accumulatedTextRef = useRef<string[]>([]);
  const [isRecording, setIsRecording] = useState(false); 
  
  async function startLive() {
    if (isRecording) return;

    // Reset accumulated text for new recording session
    accumulatedTextRef.current = [];

    onStatusChange?.("Preparing microphone…");

    const token = await getTokenOrRefresh();
    const speechConfig = SpeechConfig.fromAuthorizationToken(
      token.authToken,
      token.region
    );

    speechConfig.speechRecognitionLanguage = language;
    speechConfig.enableDictation();

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
    recognizerRef.current = recognizer;

    recognizer.sessionStarted = () => {
      setIsRecording(true);
      onStatusChange?.("Listening");
    };

    recognizer.sessionStopped = () => {
      setIsRecording(false);
      onStatusChange?.("Idle");
    };

    recognizer.canceled = (_s, e) => {
      onStatusChange?.("Canceled");
      stopLive();
      console.error("Azure Canceled:", e.errorDetails);
    };

    recognizer.recognizing = (_s, e) => {
      onInterim?.(e.result?.text || "");
    };

    recognizer.recognized = (_s, e) => {
      if (e.result.reason === ResultReason.RecognizedSpeech) {
        // Accumulate text instead of sending immediately
        accumulatedTextRef.current.push(e.result.text);
        console.log("Accumulated transcript:", e.result.text);
      }
      onInterim?.("");
    };

    recognizer.startContinuousRecognitionAsync(
      () => {},
      (err) => {
        console.error(err);
        onStatusChange?.("Error");
      }
    );
  }

  function stopLive() {
    const r = recognizerRef.current;
    if (!r) return;

    onStatusChange?.("Stopping…");

    r.stopContinuousRecognitionAsync(
      () => {
        r.close();
        recognizerRef.current = null;
        setIsRecording(false);
        onInterim?.("");
        onStatusChange?.("Idle");
        
        // Send all accumulated text once when recording stops
        const fullTranscript = accumulatedTextRef.current.join(" ").trim();
        if (fullTranscript) {
          console.log("Sending full transcript:", fullTranscript);
          onTranscript(fullTranscript);
        }
        
        // Clear accumulated text for next recording
        accumulatedTextRef.current = [];
      },
      (err) => console.error(err)
    );
  }

  return (
    <button
      className={`rounded-full px-6 py-3 text-white font-semibold transition 
      ${isRecording ? "bg-red-600 scale-105" : "bg-blue-600 hover:bg-blue-700"} 
      ${className}`}
      onMouseDown={startLive}
      onMouseUp={stopLive}
      
    >
      {isRecording ? "Recording..." : "Hold to Speak"}
    </button>
  );
}
