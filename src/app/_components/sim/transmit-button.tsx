"use client";

import 'regenerator-runtime/runtime'

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
  let transmitButtonClasses = "";

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  if (speechEnabled && !disabled) {
    transmitButtonClasses = "bg-red-600/50";
  } else {
    transmitButtonClasses = "bg-red-800/50";
  }

  const processSpeech = (speechInput: string) => {
    if (speechEnabled) {
      speechInput = swapDigitsWithWords(speechInput);
      onSpeechRecieved(speechInput);
    } else {
      throw new Error("Speech recognition is not enabled");
    }
  };

  const handleTransmitMouseDown = async () => {
    if (speechEnabled && !disabled) {
      transmitButtonClasses = "bg-red-500";
      await SpeechRecognition.startListening();
    }
  };

  const handleTransmitMouseUp = async () => {
    if (speechEnabled && !disabled) {
      transmitButtonClasses = "bg-red-300";
      await SpeechRecognition.abortListening();
      processSpeech(transcript);
      resetTranscript();
    }
  };

  const handleTransmitMouseLeave = async () => {
    if (speechEnabled && !disabled) {
      transmitButtonClasses = "bg-red-300";
      await SpeechRecognition.abortListening();
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
    <button
      id="transmit-button"
      className={`${transmitButtonClasses} w-[50px] h-[50px] cursor-pointer rounded-full border border-red-900/50 ${className}`}
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
