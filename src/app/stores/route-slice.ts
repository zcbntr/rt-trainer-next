import { create, type ExtractState } from "zustand";
import { Waypoint } from "~/lib/types/waypoint";

export type RouteSlice = ExtractState<typeof useRouteStore>;

interface RouteState {
  waypoints: Waypoint[];
  setWaypoints: (waypoints: Waypoint[]) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  removeWaypoint: (waypointId: string) => void;
  swapWaypoints: (waypointA: Waypoint, waypointB: Waypoint) => void;
}

const useRouteStore = create<RouteState>()((set) => ({
  waypoints: [],
  setWaypoints: (_waypoints: Waypoint[]) =>
    set(() => ({ waypoints: _waypoints })),
  addWaypoint: (waypoint: Waypoint) =>
    set((state) => ({ waypoints: addWaypoint(waypoint, state.waypoints) })),
  removeWaypoint: (waypointId: string) =>
    set((state) => ({
      waypoints: removeWaypoint(waypointId, state.waypoints),
    })),
  swapWaypoints: (waypointA: Waypoint, waypointB: Waypoint) =>
    set((state) => ({
      waypoints: swapWaypoints(waypointA, waypointB, state.waypoints),
    })),
}));

export default useRouteStore;

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
