"use client";

import { swapDigitsWithWords } from "~/lib/sim-utils/string-processors";

type TransmitButtonProps = {
  className?: string;
  disabled?: boolean;
  speechEnabled: boolean;
  transmitting: boolean;
};

const TransmitButton = ({
  className = "",
  disabled = false,
  speechEnabled,
  transmitting,
}: TransmitButtonProps) => {
  let SpeechRecognitionType: any;
  let SpeechGrammarList: any;
  let SpeechRecognitionEvent: any;
  let recognition: any;
  let transmitButtonClasses = "disabled";

  if (speechEnabled && !disabled) {
    transmitButtonClasses = "enabled";
  } else {
    transmitButtonClasses = "disabled";
  }

  $: if (speechEnabled) {
    SpeechRecognitionType =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    SpeechGrammarList =
      window.SpeechGrammarList || window.webkitSpeechGrammarList;
    SpeechRecognitionEvent =
      window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;
    recognition = new SpeechRecognitionType();
    recognition.lang = "en";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let speechInput = event.results[0][0].transcript;
      console.log(
        `You said: ${speechInput}, Confidence: ${event.results[0][0].confidence}`,
      );

      speechInput = swapDigitsWithWords(speechInput);

      SpeechBufferStore.set(speechInput);
    };
  } else {
    recognition = null;
  }

  const handleTransmitMouseDown = () => {
    if (speechEnabled && !disabled && !transmitting) {
      transmitButtonClasses = "enabled active";
      transmitting = true;
      recognition?.start();
    }
  };

  const handleTransmitMouseUp = () => {
    if (speechEnabled && !disabled && transmitting) {
      transmitButtonClasses = "enabled";
      transmitting = false;
      recognition?.stop();
    }
  };

  const handleTransmitMouseLeave = () => {
    if (speechEnabled && !disabled && transmitting) {
      transmitButtonClasses = "enabled";
      transmitting = false;
      recognition?.stop();
    }
  };

  function onKeyDown(e: { keyCode: any }) {
    switch (e.keyCode) {
      case 32:
        if (speechEnabled) {
          if (!disabled && !transmitting) {
            transmitButtonClasses = "enabled active";
            transmitting = true;
            recognition?.start();
          }
        }
        break;
    }
  }

  function onKeyUp(e: { keyCode: any }) {
    switch (e.keyCode) {
      case 32:
        if (speechEnabled) {
          if (!disabled && transmitting) {
            transmitButtonClasses = "enabled";
            transmitting = false;
            recognition?.stop();
          }
          break;
        }
    }
  }

  return (
    <div
      id="transmit-button"
      className={`${transmitButtonClasses} transmit-button cursor-pointer rounded-full ${className}`}
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

{
  /* <svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} />

<style lang="postcss">
	.transmit-button {
		width: 50px;
		height: 50px;
		background-color: rgba(80, 40, 40, 1);
	}

	:global(.transmit-button.enabled) {
		background-color: rgb(220, 65, 65, 0.5);
	}

	:global(.transmit-button.enabled.active) {
		background-color: rgb(220, 0, 0, 0.8);
	}
</style> */
}
