"use client";

import { type RadioDialMode, type RadioMode } from "~/lib/types/simulator";
import { create } from "zustand";
import {
  persist,
  type StateStorage,
  createJSONStorage,
} from "zustand/middleware";

const getUrlSearch = () => {
  return window.location.search.slice(1);
};

const persistentStorage: StateStorage = {
  getItem: (key): string | null => {
    // Check URL first
    if (getUrlSearch()) {
      const searchParams = new URLSearchParams(getUrlSearch());
      const storedValue = searchParams.get(key);
      return JSON.parse(storedValue!) as string;
    } else {
      return null;
    }
  },
  setItem: (key, newValue): void => {
    const searchParams = new URLSearchParams(getUrlSearch());
    searchParams.set(key, JSON.stringify(newValue));
    window.history.replaceState(null, "", `?${searchParams.toString()}`);
  },
  removeItem: (key): void => {
    const searchParams = new URLSearchParams(getUrlSearch());
    searchParams.delete(key);
    window.location.search = searchParams.toString();
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
