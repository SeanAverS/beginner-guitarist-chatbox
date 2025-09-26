import React, { useState } from "react";
import { logError } from "../utils/frontEndResponses.js"

// This component:
// Creates a microphone input button
// Transcribes microphone input 
const VoiceInput = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in your browser. Please try Chrome or Firefox.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

     // send transcribed text 
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      logError("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={handleVoiceInput}
      className={`voice-input-button ${isListening ? "listening" : ""}`}
      disabled={isListening}
    >
      <i className="fa-solid fa-microphone"></i>
    </button>
  );
};

export default VoiceInput;