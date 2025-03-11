"use client";

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
