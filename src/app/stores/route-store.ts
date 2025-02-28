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

const getUrlSearch = () => {
  return window.location.search.slice(1);
};

const persistentStorage: StateStorage = {
  getItem: (key): string => {
    // Check URL first
    if (getUrlSearch()) {
      const searchParams = new URLSearchParams(getUrlSearch());
      const storedValue = searchParams.get(key);
      return JSON.parse(storedValue!) as string;
    } else {
      // Otherwise, we should load from localstorage or alternative storage
      return JSON.parse(localStorage.getItem(key)!) as string;
    }
  },
  setItem: (key, newValue): void => {
    const searchParams = new URLSearchParams(getUrlSearch());
    searchParams.set(key, JSON.stringify(newValue));
    window.history.replaceState(null, "", `?${searchParams.toString()}`);

    localStorage.setItem(key, JSON.stringify(newValue));
  },
  removeItem: (key): void => {
    const searchParams = new URLSearchParams(getUrlSearch());
    searchParams.delete(key);
    window.location.search = searchParams.toString();

    localStorage.removeItem(key);
  },
};

const storageOptions = {
  name: "routeStore",
  storage: createJSONStorage<RouteStore>(() => persistentStorage),
};

interface RouteStore {
  waypoints: Waypoint[];
  airspacesOnRoute: Airspace[];
  airportsOnRoute: Airport[];
  distanceKM: number;
  distanceDisplayUnit: string;
  maxFL: number;
  setWaypoints: (waypoints: Waypoint[]) => void;
  moveWaypoint: (waypointId: string, newLocation: [number, number]) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  removeWaypoint: (waypointId: string) => void;
  swapWaypoints: (waypointA: Waypoint, waypointB: Waypoint) => void;
  setAirspacesOnRoute: (airspaces: Airspace[]) => void;
  setAirportsOnRoute: (airports: Airport[]) => void;
  setDistanceUnit: (unit: string) => void;
  setMaxFL: (maxFL: number) => void;
}

const useRouteStore = create(
  persist<RouteStore>(
    (set) => ({
      waypoints: [],
      airspacesOnRoute: [],
      airportsOnRoute: [],
      distanceKM: 0,
      distanceDisplayUnit: "nm",
      maxFL: 30,
      setWaypoints: (_waypoints: Waypoint[]) =>
        set(() => ({ waypoints: _waypoints })),
      moveWaypoint: (waypointId: string, newLocation: [number, number]) => {
        set((state) => ({
          waypoints: state.waypoints.map((waypoint) =>
            waypoint.id === waypointId
              ? { ...waypoint, location: newLocation }
              : waypoint,
          ),
        }));
        set((state) => ({ distanceKM: updateDistance(state.waypoints) }));
      },
      addWaypoint: (waypoint: Waypoint) => {
        set((state) => ({
          waypoints: addWaypoint(waypoint, state.waypoints),
        }));
        set((state) => ({ distanceKM: updateDistance(state.waypoints) }));
      },
      removeWaypoint: (waypointId: string) => {
        set((state) => ({
          waypoints: removeWaypoint(waypointId, state.waypoints),
        }));
        set((state) => ({ distanceKM: updateDistance(state.waypoints) }));
      },
      swapWaypoints: (waypointA: Waypoint, waypointB: Waypoint) => {
        set((state) => ({
          waypoints: swapWaypoints(waypointA, waypointB, state.waypoints),
        }));
        set((state) => ({ distanceKM: updateDistance(state.waypoints) }));
      },
      setAirspacesOnRoute: (airspaces: Airspace[]) =>
        set(() => ({ airspacesOnRoute: airspaces })),
      setAirportsOnRoute: (airports: Airport[]) =>
        set(() => ({ airportsOnRoute: airports })),
      setDistanceUnit: (unit: string) =>
        set(() => ({ distanceDisplayUnit: unit })),
      setMaxFL: (maxFL: number) => set(() => ({ maxFL })),
    }),
    storageOptions,
  ),
);

export default useRouteStore;

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
