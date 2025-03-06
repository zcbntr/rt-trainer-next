"use client";

import { Switch } from "~/components/ui/switch";

type SpeechRecognitionToggleProps = {
  speechInput?: boolean;
  speechInputSupported: boolean;
  onSpeechInputSettingChanged?: (setting: boolean) => void;
};

const SpeechRecognitionToggle = ({
  speechInput = false,
  speechInputSupported,
  onSpeechInputSettingChanged,
}: SpeechRecognitionToggleProps) => {
  function handleToggleChange() {
    if (onSpeechInputSettingChanged) {
      onSpeechInputSettingChanged(!speechInput);
    }
  }

  return (
    <Switch
      id="enable-voice-input"
      disabled={speechInputSupported}
      name="slider-label"
      defaultChecked={speechInput}
      role="switch"
      aria-checked={speechInput}
      aria-label="Toggle speech input"
      onCheckedChange={handleToggleChange}
    />
  );
};

export default SpeechRecognitionToggle;
