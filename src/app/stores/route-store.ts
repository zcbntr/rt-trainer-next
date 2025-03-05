"use client";

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
import { type Waypoint } from "~/lib/types/waypoint";
import * as turf from "@turf/turf";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";
import { isAirspaceIncludedInRoute } from "~/lib/sim-utils/route";

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
  name: "routeData",
  storage: createJSONStorage<RoutePlannerStore>(() => persistentStorage),
};

interface RoutePlannerStore {
  waypoints: Waypoint[];
  airspacesOnRoute: Airspace[];
  airportsOnRoute: Airport[];
  distanceKM: number;
  distanceDisplayUnit: string;
  maxFL: number;
  scenarioSeed: string;
  hasEmergencyEvents: boolean;
  showOnlyOnRouteAirspaces: boolean;
  showAirspacesAboveMaxFL: boolean;
  setWaypoints: (waypoints: Waypoint[], airspaces: Airspace[]) => void;
  moveWaypoint: (
    waypointId: string,
    newLocation: [number, number],
    airspaces: Airspace[],
  ) => void;
  addWaypoint: (waypoint: Waypoint, airspaces: Airspace[]) => void;
  removeWaypoint: (waypointId: string, airspaces: Airspace[]) => void;
  swapWaypoints: (
    waypointA: Waypoint,
    waypointB: Waypoint,
    airspaces: Airspace[],
  ) => void;
  setAirspacesOnRoute: (airspaces: Airspace[]) => void;
  setAirportsOnRoute: (airports: Airport[]) => void;
  setDistanceUnit: (unit: string) => void;
  setMaxFL: (maxFL: number) => void;
  setScenarioSeed: (seed: string) => void;
  setHasEmergencyEvents: (hasEmergencyEvents: boolean) => void;
  setShowOnlyOnRouteAirspaces: (showOnlyOnRouteAirspaces: boolean) => void;
  setShowAirspacesAboveMaxFL: (showAirspacesAboveMaxFL: boolean) => void;
}

const useRoutePlannerStore = create(
  persist<RoutePlannerStore>(
    (set) => ({
      waypoints: [],
      airspacesOnRoute: [],
      airportsOnRoute: [],
      distanceKM: 0,
      distanceDisplayUnit: "nm",
      maxFL: 30,
      scenarioSeed: "",
      hasEmergencyEvents: false,
      showOnlyOnRouteAirspaces: false,
      showAirspacesAboveMaxFL: false,
      setWaypoints: (_waypoints: Waypoint[], airspaces: Airspace[]) => {
        set(() => ({ waypoints: _waypoints }));
        set((state) => ({ distanceKM: updateDistance(state.waypoints) }));
        set((state) => ({
          airspacesOnRoute: updateAirspacesOnRoute(state.waypoints, airspaces),
        }));
      },
      moveWaypoint: (
        waypointId: string,
        newLocation: [number, number],
        airspaces: Airspace[],
      ) => {
        set((state) => ({
          waypoints: state.waypoints.map((waypoint) =>
            waypoint.id === waypointId
              ? { ...waypoint, location: newLocation }
              : waypoint,
          ),
        }));
        set((state) => ({ distanceKM: updateDistance(state.waypoints) }));
        set((state) => ({
          airspacesOnRoute: updateAirspacesOnRoute(state.waypoints, airspaces),
        }));
      },
      addWaypoint: (waypoint: Waypoint, airspaces: Airspace[]) => {
        set((state) => ({
          waypoints: addWaypoint(waypoint, state.waypoints),
        }));
        set((state) => ({ distanceKM: updateDistance(state.waypoints) }));
        set((state) => ({
          airspacesOnRoute: updateAirspacesOnRoute(state.waypoints, airspaces),
        }));
      },
      removeWaypoint: (waypointId: string, airspaces: Airspace[]) => {
        set((state) => ({
          waypoints: removeWaypoint(waypointId, state.waypoints),
        }));
        set((state) => ({ distanceKM: updateDistance(state.waypoints) }));
        set((state) => ({
          airspacesOnRoute: updateAirspacesOnRoute(state.waypoints, airspaces),
        }));
      },
      swapWaypoints: (
        waypointA: Waypoint,
        waypointB: Waypoint,
        airspaces: Airspace[],
      ) => {
        set((state) => ({
          waypoints: swapWaypoints(waypointA, waypointB, state.waypoints),
        }));
        set((state) => ({ distanceKM: updateDistance(state.waypoints) }));
        set((state) => ({
          airspacesOnRoute: updateAirspacesOnRoute(state.waypoints, airspaces),
        }));
      },
      setAirspacesOnRoute: (airspaces: Airspace[]) =>
        set(() => ({ airspacesOnRoute: airspaces })),
      setAirportsOnRoute: (airports: Airport[]) =>
        set(() => ({ airportsOnRoute: airports })),
      setDistanceUnit: (unit: string) =>
        set(() => ({ distanceDisplayUnit: unit })),
      setMaxFL: (maxFL: number) => set(() => ({ maxFL })),
      setScenarioSeed: (seed: string) => set(() => ({ scenarioSeed: seed })),
      setHasEmergencyEvents: (hasEmergencyEvents: boolean) =>
        set(() => ({ hasEmergencyEvents })),
      setShowOnlyOnRouteAirspaces: (showOnlyOnRouteAirspaces: boolean) =>
        set(() => ({ showOnlyOnRouteAirspaces })),
      setShowAirspacesAboveMaxFL: (showAirspacesAboveMaxFL: boolean) =>
        set(() => ({ showAirspacesAboveMaxFL })),
    }),
    storageOptions,
  ),
);

export default useRoutePlannerStore;

function updateAirspacesOnRoute(
  waypoints: Waypoint[],
  airspaces: Airspace[],
): Airspace[] {
  if (!airspaces || !waypoints || waypoints.length < 2) {
    return [];
  }

  const airspacesOnRoute = airspaces.filter((airspace) =>
    isAirspaceIncludedInRoute(
      waypoints.map((waypoint) => waypoint.location),
      airspace,
    ),
  );
  return airspacesOnRoute;
}

function updateDistance(waypoints: Waypoint[]): number {
  let distance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    if (!from?.location || !to?.location) {
      throw new Error("Waypoint is missing location");
    }

    distance += turf.distance(from.location, to.location);
  }
  return distance;
}

function swapWaypoints(
  _waypointA: Waypoint,
  _waypointB: Waypoint,
  waypoints: Waypoint[],
): Waypoint[] {
  const cardAIndex = waypoints.indexOf(_waypointA);
  const cardBIndex = waypoints.indexOf(_waypointB);
  waypoints[cardAIndex] = _waypointB;
  waypoints[cardBIndex] = _waypointA;
  waypoints.forEach((waypoint, index) => {
    waypoint.index = index;
  });
  return waypoints;
}

function addWaypoint(waypoint: Waypoint, waypoints: Waypoint[]): Waypoint[] {
  waypoint.index = waypoints.length;
  return [...waypoints, waypoint];
}

function removeWaypoint(waypointId: string, waypoints: Waypoint[]): Waypoint[] {
  waypoints = waypoints.filter((w) => w.id !== waypointId);
  waypoints.forEach((waypoint, index) => {
    waypoint.index = index;
  });
  return waypoints;
}
