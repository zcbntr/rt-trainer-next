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
import { type ScenarioPoint } from "~/lib/types/scenario";

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
  name: "scenarioData",
  storage: createJSONStorage<ScenarioStoreState>(() => persistentStorage),
};

interface ScenarioStoreState {
  scenarioId: number;
  waypoints: Waypoint[];
  airspacesOnRoute: Airspace[];
  airportsOnRoute: Airport[];
  hasEmergencyEvents: boolean;
  scenarioPoints: ScenarioPoint[];
  scenarioPointIndex: number;
  scenarioStartPointIndex: number;
  scenarioEndPointIndex: number;
  setScenarioId: (scenarioId: number) => void;
  setWaypoints: (waypoints: Waypoint[]) => void;
  setAirspacesOnRoute: (airspaces: Airspace[]) => void;
  setAirportsOnRoute: (airports: Airport[]) => void;
  setHasEmergencyEvents: (hasEmergencyEvents: boolean) => void;
  setScenarioPoints: (scenarioPoints: ScenarioPoint[]) => void;
  setScenarioPointIndex: (index: number) => void;
  setScenarioStartPointIndex: (index: number) => void;
  setScenarioEndPointIndex: (index: number) => void;
}

const useScenarioStore = create(
  persist<ScenarioStoreState>(
    (set) => ({
      scenarioId: -1,
      waypoints: [],
      airspacesOnRoute: [],
      airportsOnRoute: [],
      hasEmergencyEvents: false,
      scenarioPoints: [],
      scenarioPointIndex: 0,
      scenarioStartPointIndex: 0,
      scenarioEndPointIndex: 0,
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
      setScenarioPoints: (scenarioPoints: ScenarioPoint[]) =>
        set(() => ({ scenarioPoints })),
      setScenarioPointIndex: (index: number) =>
        set(() => ({ scenarioPointIndex: index })),
      setScenarioStartPointIndex: (index: number) =>
        set(() => ({ scenarioStartPointIndex: index })),
      setScenarioEndPointIndex: (index: number) =>
        set(() => ({ scenarioEndPointIndex: index })),
    }),
    storageOptions,
  ),
);

export default useScenarioStore;
