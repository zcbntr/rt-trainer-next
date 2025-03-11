"use client";

import { type RadioDialMode, type RadioMode } from "~/lib/types/simulator";
import { create } from "zustand";
import {
  persist,
  type StateStorage,
  createJSONStorage,
} from "zustand/middleware";

const persistentStorage: StateStorage = {
  getItem: (key): string => {
    return JSON.parse(localStorage.getItem(key)!) as string;
  },
  setItem: (key, newValue): void => {
    localStorage.setItem(key, JSON.stringify(newValue));
  },
  removeItem: (key): void => {
    localStorage.removeItem(key);
  },
};

const storageOptions = {
  name: "radioState",
  storage: createJSONStorage<RadioStateStore>(() => persistentStorage),
};

interface RadioStateStore {
  mode: RadioMode;
  dialMode: RadioDialMode;
  activeFrequency: string;
  standbyFrequency: string;
  tertiaryFrequency: string;
  setMode: (mode: RadioMode) => void;
  setDialMode: (dialMode: RadioDialMode) => void;
  setActiveFrequency: (frequency: string) => void;
  setStandbyFrequency: (frequency: string) => void;
  setTertiaryFrequency: (frequency: string) => void;
  swapActiveAndStandbyFrequencies: () => void;
}

const useRadioStore = create(
  persist<RadioStateStore>(
    (set) => ({
      mode: "OFF",
      dialMode: "OFF",
      activeFrequency: "121.130",
      standbyFrequency: "121.210",
      tertiaryFrequency: "121.900",
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
    storageOptions,
  ),
);

export default useRadioStore;
