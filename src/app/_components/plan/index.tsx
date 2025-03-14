"use client";

import RoutePlannerMap from "~/app/_components/maps/scenario-planner";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { ScenarioPlannerSidebar } from "~/app/_components/scenario-planner-sidebar";
import ScenarioPlannerFooter from "~/app/_components/scenario-planner-footer";
import { type Waypoint } from "~/lib/types/waypoint";
import React from "react";
import useScenarioPlannerStore from "~/app/stores/plan-store";
import useAeronauticalDataStore from "~/app/stores/aeronautical-data-store";

type PlanPageProps = {
  existingRouteId?: number;
  waypoints: Waypoint[];
  airspaceIds: string[];
  airportIds: string[];
};

const PlanPageComponent = ({
  existingRouteId,
  waypoints,
  airspaceIds,
  airportIds,
}: PlanPageProps) => {
  // Push waypoints to store, look up airpsace and airport ids and add them to store
  const setExistingRouteId = useScenarioPlannerStore(
    (state) => state.setExistingScenarioId,
  );
  const setWaypoints = useScenarioPlannerStore((state) => state.setWaypoints);
  const setOnRouteAirspaces = useScenarioPlannerStore(
    (state) => state.setAirspacesOnRoute,
  );
  const setOnRouteAirports = useScenarioPlannerStore(
    (state) => state.setAirportsOnRoute,
  );
  const airspaces = useAeronauticalDataStore((state) => state.airspaces);
  const airports = useAeronauticalDataStore((state) => state.airports);

  React.useEffect(() => {
    if (existingRouteId != -1 && existingRouteId != undefined) {
      setExistingRouteId(existingRouteId);
    }

    setWaypoints(waypoints, []);

    // Fetch airspaces and airports based on ids
    const onRouteAirspaces = airspaces.filter((airspace) =>
      airspaceIds.includes(airspace._id),
    );
    const onRouteAirports = airports.filter((airport) =>
      airportIds.includes(airport._id),
    );

    setOnRouteAirspaces(onRouteAirspaces);
    setOnRouteAirports(onRouteAirports);
  }, [
    waypoints,
    setWaypoints,
    airspaceIds,
    airportIds,
    airspaces,
    airports,
    setOnRouteAirspaces,
    setOnRouteAirports,
    existingRouteId,
    setExistingRouteId,
  ]);

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "350px" } as React.CSSProperties}
    >
      <ScenarioPlannerSidebar />
      <SidebarInset>
        <div className="flex h-full w-full flex-col place-content-center">
          <div className="flex h-full w-full flex-col place-content-center sm:place-content-start">
            <div className="xs:pr-3 flex h-full min-h-96 w-full min-w-96 flex-col">
              <RoutePlannerMap className="h-full w-full" />
            </div>
            <ScenarioPlannerFooter />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default PlanPageComponent;
