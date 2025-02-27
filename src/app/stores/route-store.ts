import { create, type ExtractState } from "zustand";
import { Waypoint } from "~/lib/types/waypoint";
import * as turf from "@turf/turf";

export type RouteSlice = ExtractState<typeof useRouteStore>;

interface RouteState {
  waypoints: Waypoint[];
  distanceKM: number;
  distanceDisplayUnit: string;
  maxFL: number;
  setWaypoints: (waypoints: Waypoint[]) => void;
  moveWaypoint: (waypointId: string, newLocation: [number, number]) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  removeWaypoint: (waypointId: string) => void;
  swapWaypoints: (waypointA: Waypoint, waypointB: Waypoint) => void;
  setDistanceUnit: (unit: string) => void;
  setMaxFL: (maxFL: number) => void;
}

const useRouteStore = create<RouteState>()((set) => ({
  waypoints: [],
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
  setDistanceUnit: (unit: string) => set(() => ({ distanceDisplayUnit: unit })),
  setMaxFL: (maxFL: number) => set(() => ({ maxFL })),
}));

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
