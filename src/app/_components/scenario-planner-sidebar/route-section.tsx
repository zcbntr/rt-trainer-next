"use client";

import { useMemo } from "react";
import {
  MdOutlineMoreHoriz,
  MdDelete,
  MdRefresh,
  MdLocationPin,
} from "react-icons/md";
import useAeronauticalDataStore from "~/app/stores/aeronautical-data-store";
import useRoutePlannerStore from "~/app/stores/route-store";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { generateFRTOLRouteFromSeed } from "~/lib/route-gen";
import { type Waypoint } from "~/lib/types/waypoint";
import { randomString } from "~/lib/utils";

const RouteSection = () => {
  let routeSeed = randomString(6);

  const waypoints: Waypoint[] = useRoutePlannerStore(
    (state) => state.waypoints,
  );
  const setWaypoints = useRoutePlannerStore((state) => state.setWaypoints);
  // const swapWaypoints = useRouteStore((state) => state.swapWaypoints);
  const removeWaypoint = useRoutePlannerStore((state) => state.removeWaypoint);

  //   For route gen
  const airspaces = useAeronauticalDataStore((state) => state.airspaces);
  const airports = useAeronauticalDataStore((state) => state.airports);

  const maxFL = useRoutePlannerStore((state) => state.maxFL);
  // const swapWaypoints = useRouteStore((state) => state.swapWaypoints);
  const setAirspacesOnRoute = useRoutePlannerStore(
    (state) => state.setAirspacesOnRoute,
  );
  const setAirportsOnRoute = useRoutePlannerStore(
    (state) => state.setAirportsOnRoute,
  );

  async function loadSeededRoute() {
    if (
      !airports.length ||
      !airspaces.length ||
      !routeSeed ||
      routeSeed.length == 0 ||
      maxFL == 0
    ) {
      return;
    }

    const routeData = generateFRTOLRouteFromSeed(
      routeSeed,
      airports,
      airspaces,
      maxFL,
    );

    if (routeData) {
      setWaypoints(routeData.waypoints, airspaces);
      setAirportsOnRoute(routeData.airports);
      setAirspacesOnRoute(routeData.airspaces);
    }
  }

  const waypointDetails = useMemo(() => {
    return waypoints.map((waypoint) => {
      return (
        <div
          className="card flex flex-row place-content-center gap-2 rounded-sm border p-2"
          key={waypoint.id}
          draggable
          //   animate:flip={{ duration: dragDuration }}
          //   on:dragstart={() => {
          //     draggingWaypoint = waypoint;
          //   }}
          //   on:dragend={() => {
          //     draggingWaypoint = undefined;
          //   }}
          //   on:dragenter={() => {
          //     swapWith(waypoint);
          //   }}
          //   on:dragover={(e) => {
          //     e.preventDefault();
          //   }}
        >
          <div className="flex flex-col place-content-center">
            <MdLocationPin size="1.5em" />
          </div>
          <div className="flex flex-col place-content-center">
            <Input defaultValue={waypoint.name} />
          </div>
          <div className="flex flex-col place-content-center">
            <button
              className="flex flex-col place-content-center"
              //   use:popup={{
              //     event: "click",
              //     target: waypoint.name + "-waypoint-details-popup",
              //     placement: "bottom",
              //   }}
            >
              <MdOutlineMoreHoriz />
            </button>
          </div>

          <div
            id={`${waypoint.name}-waypoint-details-popup`}
            className="flex flex-col place-content-center"
          >
            <button
              onClick={() => {
                removeWaypoint(waypoint.id, airspaces);
              }}
            >
              <MdDelete />
            </button>
          </div>
        </div>
      );
    });
  }, [removeWaypoint, waypoints, airspaces]);

  function onClearClick() {
    setWaypoints([], []);
  }

  // const dragDuration = 200;
  // const animatingWaypoints = new Set();

  // function swapWaypointDetails(
  //   _draggingWaypoint: Waypoint,
  //   _waypointToSwap: Waypoint,
  // ): void {
  //   if (
  //     _draggingWaypoint === _waypointToSwap ||
  //     animatingWaypoints.has(_waypointToSwap)
  //   )
  //     return;
  //   animatingWaypoints.add(_waypointToSwap);
  //   setTimeout(
  //     (): boolean => animatingWaypoints.delete(_waypointToSwap),
  //     dragDuration,
  //   );

  //   swapWaypoints(_draggingWaypoint, _waypointToSwap);
  // }

  if (waypoints.length === 0) {
    return (
      <div className="flex h-full flex-col gap-4 px-1">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Add a waypoint by clicking on an airport or any other spot on the map.
          Or use the <b>Auto-generate</b> tool.
        </p>

        <div className="flex flex-col gap-2">
          <Label>Auto-generate</Label>
          <div className="flex flex-row gap-3">
            <Input
              id="seed-input"
              placeholder="Enter a seed"
              defaultValue={routeSeed}
            />
            <Button
              variant="link"
              className="w-10"
              onClick={() => {
                routeSeed = randomString(6);

                const element = document.getElementById("seed-input");
                if (element) {
                  (element as HTMLInputElement).value = routeSeed;
                }
              }}
            >
              <MdRefresh />
            </Button>
          </div>

          <Button className="w-full" onClick={loadSeededRoute}>
            Generate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col pb-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Edit your waypoints. Drag to rearrange order.
        </p>
      </div>
      <div className="flex flex-col gap-2">{waypointDetails}</div>
      <Button
        variant="link"
        onClick={onClearClick}
        className="text-muted-foreground"
      >
        Clear Waypoints
      </Button>
    </div>
  );
};

export default RouteSection;
