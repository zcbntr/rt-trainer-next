"use client";

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
  name: "altimeterState",
  storage: createJSONStorage<AltimeterStateStore>(() => persistentStorage),
};

interface AltimeterStateStore {
  shownPressure: number;
  shownAltitude: number;
  setShownPressure: (newPressure: number) => void;
}

const useAltimeterStore = create(
  persist<AltimeterStateStore>(
    (set) => ({
      shownPressure: 1013,
      shownAltitude: 0,
      setShownPressure: (newPressure: number) =>
        set(() => ({ shownPressure: newPressure })),
    }),
    storageOptions,
  ),
);

export default useAltimeterStore;
