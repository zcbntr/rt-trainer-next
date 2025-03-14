import { api } from "~/trpc/server";
import { type Waypoint } from "~/lib/types/waypoint";
import PlanPageComponent from "../_components/plan";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scenarioId = (await searchParams).edit;

  let waypoints: Waypoint[] = [];

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

    waypoints = scenario.waypoints.map((waypoint) => {
      return {
        id: waypoint.id.toString(),
        name: waypoint.name,
        type: waypoint.type,
        location: [parseFloat(waypoint.lon), parseFloat(waypoint.lat)],
        index: waypoint.index,
      };
    });
  }

  return <PlanPageComponent waypoints={waypoints} />;
}
