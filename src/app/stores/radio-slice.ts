import { type RadioDialMode, type RadioMode } from "~/lib/types/simulator";
import { create, type ExtractState } from "zustand";
import { combine } from "zustand/middleware";

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
      swapActiveAndStandbyFrequencies: () =>
        set((state) => ({
          activeFrequency: state.standbyFrequency,
          standbyFrequency: state.activeFrequency,
        })),
    }),
  ),
);

export default useRadioStore;
