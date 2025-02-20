"use client";

import { Switch } from "~/components/ui/switch";

type SpeechRecognitionToggleProps = {
  speechInput?: boolean;
  speechInputSupported: boolean;
};

const SpeechRecognitionToggle = ({
  speechInput = false,
  speechInputSupported,
}: SpeechRecognitionToggleProps) => {
  const speechRecognitionEnabled = new CustomEvent("speechRecognitionEnabled");
  const speechRecognitionDisabled = new CustomEvent(
    "speechRecognitionDisabled",
  );

  function handleToggleChange() {
    if (speechInput) {
      document.dispatchEvent(speechRecognitionDisabled);
    } else {
      document.dispatchEvent(speechRecognitionEnabled);
    }
  }

  return (
    <Switch
      id="enable-voice-input"
      disabled={speechInputSupported}
      name="slider-label"
      checked={speechInput}
      role="switch"
      aria-checked={speechInput}
      aria-label="Toggle speech input"
      onCheckedChange={handleToggleChange}
    />
  );
};

export default SpeechRecognitionToggle;
