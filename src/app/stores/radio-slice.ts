import { type RadioMode, type RadioState } from "~/lib/types/simulator";
import { create } from "zustand";

// If types play up here turn them into interfaces as shown in https://zustand.docs.pmnd.rs/guides/typescript
// Then extract the type for use elsewhere

const useRadioStore = create<RadioState>()((set) => ({
  mode: "OFF",
  dialMode: "OFF",
  activeFrequency: "118.000",
  standbyFrequency: "118.000",
  tertiaryFrequency: "118.000",
  setMode: (mode: RadioMode) => set(() => ({ mode: mode })),
}));
