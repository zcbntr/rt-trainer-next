"use client";

/*
  This store holds the data about the aircraft e.g. callsign, prefix, and type
*/

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
  name: "aircraftData",
  storage: createJSONStorage<AircraftDataStore>(() => persistentStorage),
};

interface AircraftDataStore {
  type: string;
  callsign: string;
  prefix: string;
  setType: (_type: string) => void;
  setCallsign: (callsign: string) => void;
  setPrefix: (prefix: string) => void;
}

const useAircraftDataStore = create(
  persist<AircraftDataStore>(
    (set) => ({
      type: "",
      callsign: "",
      prefix: "",
      setType: (_type: string) => set(() => ({ type: _type })),
      setCallsign: (_callsign: string) => set(() => ({ callsign: _callsign })),
      setPrefix: (_prefix: string) => set(() => ({ prefix: _prefix })),
    }),
    storageOptions,
  ),
);

export default useAircraftDataStore;
