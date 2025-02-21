import { type RadioDialMode, type RadioMode, type RadioState } from "~/lib/types/simulator";
import { create } from "zustand";

// If types play up here turn them into interfaces as shown in https://zustand.docs.pmnd.rs/guides/typescript
// Then extract the type for use elsewhere

export interface RadioState {
  mode: RadioMode;
  dialMode: RadioDialMode;
  activeFrequency: string;
  standbyFrequency: string;
  tertiaryFrequency: string;
  setMode: (mode: RadioMode) => void;
  setDialMode: (dialMode: RadioDialMode) => void;

};

const useRadioStore = create<RadioState>()((set) => ({
  mode: "OFF",
  dialMode: "OFF",
  activeFrequency: "118.000",
  standbyFrequency: "118.000",
  tertiaryFrequency: "118.000",
  setMode: (mode: RadioMode) => set(() => ({ mode: mode })),
  setDialMode: (dialMode: RadioDialMode) => set(() => ({ dialMode: dialMode })),
  setActiveFrequency: (frequency: string) => set(() => ({ activeFrequency: frequency })),
  setStandbyFrequency: (frequency: string) => set(() => ({ standbyFrequency: frequency })),
  setTertiaryFrequency: (frequency: string) => set(() => ({ tertiaryFrequency: frequency })),
}));
