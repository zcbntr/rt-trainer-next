import { create, type ExtractState } from "zustand";
import { Waypoint } from "~/lib/types/waypoint";

export type RouteSlice = ExtractState<typeof useRouteStore>;

interface RouteState {
  waypoints: Waypoint[];
  setWaypoints: (waypoints: Waypoint[]) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  removeWaypoint: (waypointId: string) => void;
}

const useRouteStore = create<RouteState>()((set) => ({
  waypoints: [],
  setWaypoints: (_waypoints: Waypoint[]) =>
    set(() => ({ waypoints: _waypoints })),
  addWaypoint: (waypoint: Waypoint) =>
    set((state) => ({ waypoints: [...state.waypoints, waypoint] })),
  removeWaypoint: (waypointId: string) =>
    set((state) => ({
      waypoints: state.waypoints.filter((w) => w.id !== waypointId),
    })),
}));

export default useRouteStore;
