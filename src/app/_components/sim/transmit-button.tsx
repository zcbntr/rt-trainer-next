"use client";

import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { swapDigitsWithWords } from "~/lib/sim-utils/string-processors";

type TransmitButtonProps = {
  className?: string;
  disabled?: boolean;
  speechEnabled: boolean;
  onSpeechRecieved: (transcript: string) => void;
};

const TransmitButton = ({
  className = "",
  disabled = false,
  speechEnabled,
  onSpeechRecieved,
}: TransmitButtonProps) => {
  let transmitButtonClasses = "disabled";

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  if (speechEnabled && !disabled) {
    transmitButtonClasses = "bg-red-300";
  } else {
    transmitButtonClasses = "bg-red-200/50";
  }

  const processSpeech = (speechInput: string) => {
    if (speechEnabled) {
      speechInput = swapDigitsWithWords(speechInput);
      onSpeechRecieved(speechInput);
    } else {
      throw new Error("Speech recognition is not enabled");
    }
  };

  const handleTransmitMouseDown = () => {
    if (speechEnabled && !disabled) {
      transmitButtonClasses = "bg-red-500";
      SpeechRecognition.startListening();
    }
  };

  const handleTransmitMouseUp = () => {
    if (speechEnabled && !disabled) {
      transmitButtonClasses = "bg-red-300";
      SpeechRecognition.abortListening();
      processSpeech(transcript);
      resetTranscript();
    }
  };

  const handleTransmitMouseLeave = () => {
    if (speechEnabled && !disabled) {
      transmitButtonClasses = "bg-red-300";
      SpeechRecognition.abortListening();
      processSpeech(transcript);
      resetTranscript();
    }
  };

  // function onKeyDown(e: { keyCode: any }) {
  //   switch (e.keyCode) {
  //     case 32:
  //       if (speechEnabled && !disabled) {
  //         transmitButtonClasses = "bg-red-500";
  //         SpeechRecognition.startListening();
  //       }
  //       break;
  //   }
  // }

  // function onKeyUp(e: { keyCode: any }) {
  //   switch (e.keyCode) {
  //     case 32:
  //       if (speechEnabled && !disabled) {
  //         transmitButtonClasses = "bg-red-300";
  //         SpeechRecognition.abortListening();
  //         processSpeech(transcript);
  //         resetTranscript();

  //         break;
  //       }
  //   }
  // }

  return (
    <div
      id="transmit-button"
      className={`${transmitButtonClasses} w-50 h-50 cursor-pointer rounded-full ${className}`}
      onMouseDown={handleTransmitMouseDown}
      onKeyDown={handleTransmitMouseDown}
      onMouseUp={handleTransmitMouseUp}
      onKeyUp={handleTransmitMouseUp}
      onMouseLeave={handleTransmitMouseLeave}
      aria-label="Transmit Button"
      role="button"
    />
  );
};

export default TransmitButton;
