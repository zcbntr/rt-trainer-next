"use client";

import RoutePlannerMap from "~/app/_components/maps/scenario-planner";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { ScenarioPlannerSidebar } from "~/app/_components/scenario-planner-sidebar";
import ScenarioPlannerFooter from "~/app/_components/scenario-planner-footer";
import { type Waypoint } from "~/lib/types/waypoint";
import React from "react";
import useRoutePlannerStore from "~/app/stores/route-store";

type PlanPageProps = {
  waypoints: Waypoint[];
};

const PlanPageComponent = ({ waypoints }: PlanPageProps) => {
  // Push waypoints to store
  const setWaypoints = useRoutePlannerStore((state) => state.setWaypoints);
  React.useEffect(() => {
    setWaypoints(waypoints, []);
  }, [waypoints, setWaypoints]);

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
