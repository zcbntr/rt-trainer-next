import RoutePlannerMap from "../_components/maps/route-planner";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { ScenarioPlannerSidebar } from "../_components/scenario-planner-sidebar";
import ScenarioPlannerFooter from "../_components/scenario-planner-footer";
import { redirect } from "next/navigation";
import { api } from "~/trpc/server";
import { type Waypoint } from "~/lib/types/waypoint";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scenarioId = (await searchParams).edit;

  if (
    scenarioId &&
    typeof scenarioId === "string" &&
    parseInt(scenarioId) >= 0
  ) {
    // get scenario data from db
    const scenario = await api.scenario.getOwnedScenarioById({
      id: parseInt(scenarioId),
    });

    if (!scenario) {
      return;
    }

    const waypoints: Waypoint[] = scenario.waypoints.map((waypoint) => {
      return {
        id: waypoint.id.toString(),
        name: waypoint.name,
        type: waypoint.type,
        location: [parseFloat(waypoint.lon), parseFloat(waypoint.lat)],
        index: waypoint.index,
      };
    });

    const waypointURLComponent = `waypoints=${encodeURIComponent(JSON.stringify(waypoints))}`;

    // load scenario stores into url
    redirect(`/plan?${waypointURLComponent}&editing=${scenarioId}`);
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
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
}
