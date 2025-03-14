"use client";

/*
  This store is used to manage the state of the simulator and holds scenario information.
  It uses zustand for state management and zustand/middleware for persistence.
  The store is persisted in local storage.
  This allows for the state to be maintained across page reloads.
*/

import { create } from "zustand";
import {
  persist,
  type StateStorage,
  createJSONStorage,
} from "zustand/middleware";
import { type Waypoint } from "~/lib/types/waypoint";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";

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
  name: "planData",
  storage: createJSONStorage<SimulatorStoreState>(() => persistentStorage),
};

interface SimulatorStoreState {
  scenarioId: number;
  waypoints: Waypoint[];
  airspacesOnRoute: Airspace[];
  airportsOnRoute: Airport[];
  hasEmergencyEvents: boolean;
  setScenarioId: (scenarioId: number) => void;
  setWaypoints: (waypoints: Waypoint[], airspaces: Airspace[]) => void;
  setAirspacesOnRoute: (airspaces: Airspace[]) => void;
  setAirportsOnRoute: (airports: Airport[]) => void;
  setHasEmergencyEvents: (hasEmergencyEvents: boolean) => void;
}

const useSimulatorStore = create(
  persist<SimulatorStoreState>(
    (set) => ({
      scenarioId: -1,
      waypoints: [],
      airspacesOnRoute: [],
      airportsOnRoute: [],
      hasEmergencyEvents: false,
      setScenarioId: (scenarioId: number) =>
        set(() => ({ scenarioId: scenarioId })),
      setWaypoints: (_waypoints: Waypoint[]) => {
        set(() => ({ waypoints: _waypoints }));
      },
      setAirspacesOnRoute: (airspaces: Airspace[]) =>
        set(() => ({ airspacesOnRoute: airspaces })),
      setAirportsOnRoute: (airports: Airport[]) =>
        set(() => ({ airportsOnRoute: airports })),
      setHasEmergencyEvents: (hasEmergencyEvents: boolean) =>
        set(() => ({ hasEmergencyEvents })),
    }),
    storageOptions,
  ),
);

export default useSimulatorStore;
