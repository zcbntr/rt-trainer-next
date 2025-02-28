/*
  This store is used to manage the waypoints and the route data.
  It uses zustand for state management and zustand/middleware for persistence.
  The store is persisted in local storage and the URL query params.
  This allows for the state to be maintained across page reloads and shared via URL.
  The store provides functions to add, remove, and move waypoints, as well as set the distance unit and max flight level.
  The store also calculates the distance between waypoints and updates the distance display unit.
*/

import { create } from "zustand";
import {
  persist,
  type StateStorage,
  createJSONStorage,
} from "zustand/middleware";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";

const persistentStorage: StateStorage = {
  getItem: (key): string => {
    // Load from localstorage
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
  name: "aeronauticalDataStore",
  storage: createJSONStorage<AeronauticalDataStore>(() => persistentStorage),
};

interface AeronauticalDataStore {
  airspaces: Airspace[];
  airports: Airport[];
}

const useAeronauticalDataStore = create(
  persist<AeronauticalDataStore>(
    (set) => ({
      airspaces: [],
      airports: [],
      setAirspaces: (_airspaces: Airspace[]) =>
        set(() => ({ airspaces: _airspaces })),
      setAirports: (_airports: Airport[]) =>
        set(() => ({ airports: _airports })),
    }),
    storageOptions,
  ),
);

export default useAeronauticalDataStore;
