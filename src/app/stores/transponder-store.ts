"use client";

import { type TransponderDialMode } from "~/lib/types/simulator";
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
  name: "transponderState",
  storage: createJSONStorage<TransponderStateStore>(() => persistentStorage),
};

interface TransponderStateStore {
  dialMode: TransponderDialMode;
  frequency: string;
  identEnabled: boolean;
  vfrHasExecuted: boolean;
  displayDigitSelected: number;
  setDialMode: (dialMode: TransponderDialMode) => void;
  setFrequency: (frequency: string) => void;
  setIdentEnabled: (identEnabled: boolean) => void;
  setVFRHasExecuted: (vfrHasExecuted: boolean) => void;
  setDisplayDigitSelected: (displayDigitSelected: number) => void;
}

const useTransponderStore = create(
  persist<TransponderStateStore>(
    (set) => ({
      dialMode: "OFF",
      frequency: "1200",
      identEnabled: false,
      vfrHasExecuted: false,
      displayDigitSelected: 0,
      setDisplayDigitSelected: (displayDigitSelected: number) =>
        set(() => ({ displayDigitSelected: displayDigitSelected })),
      setDialMode: (dialMode: TransponderDialMode) =>
        set(() => ({ dialMode: dialMode })),
      setFrequency: (frequency: string) =>
        set(() => ({ frequency: frequency })),
      setIdentEnabled: (identEnabled: boolean) =>
        set(() => ({ identEnabled: identEnabled })),
      setVFRHasExecuted: (vfrHasExecuted: boolean) =>
        set(() => ({ vfrHasExecuted: vfrHasExecuted })),
    }),
    storageOptions,
  ),
);

export default useTransponderStore;
