import { type RadioDialMode, type RadioMode } from "~/lib/types/simulator";
import { create, type ExtractState } from "zustand";
import { combine } from "zustand/middleware";

// If types play up here turn them into interfaces as shown in https://zustand.docs.pmnd.rs/guides/typescript
// Then extract the type for use elsewhere

export type RadioState = ExtractState<typeof useRadioStore>;

const useRadioStore = create(
  combine(
    {
      mode: "OFF",
      dialMode: "OFF",
      activeFrequency: "118.000",
      standbyFrequency: "118.000",
      tertiaryFrequency: "118.000",
    },
    (set) => ({
      setMode: (mode: RadioMode) => set(() => ({ mode: mode })),
      setDialMode: (dialMode: RadioDialMode) =>
        set(() => ({ dialMode: dialMode })),
      setActiveFrequency: (frequency: string) =>
        set(() => ({ activeFrequency: frequency })),
      setStandbyFrequency: (frequency: string) =>
        set(() => ({ standbyFrequency: frequency })),
      setTertiaryFrequency: (frequency: string) =>
        set(() => ({ tertiaryFrequency: frequency })),
    }),
  ),
);

export default useRadioStore;
