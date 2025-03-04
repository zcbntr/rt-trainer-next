/*
  This store holds the data about the aircraft e.g. callsign, prefix, and type
*/

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
