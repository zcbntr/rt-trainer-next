import { create, type ExtractState } from "zustand";
import { Waypoint } from "~/lib/types/waypoint";

export type RouteSlice = ExtractState<typeof useRouteStore>;

interface RouteState {
  waypoints: Waypoint[];
}

const useRouteStore = create<RouteState>()((set) => ({
  waypoints: [],
  setWaypoints: (_waypoints: Waypoint[]) =>
    set(() => ({ waypoints: _waypoints })),
}));

export default useRouteStore;
