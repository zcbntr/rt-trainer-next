import { api } from "~/trpc/server";
import { type Waypoint } from "~/lib/types/waypoint";
import PlanPageComponent from "../_components/plan";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scenarioId = (await searchParams).edit;

  let scenarioToLoadId: number | undefined = undefined;
  let waypoints: Waypoint[] = [];
  let airspaceIds: string[] = [];
  let airportIds: string[] = [];

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

    if (scenarioId) {
      const intScenarioToLoadId = parseInt(scenarioId);
      if (intScenarioToLoadId >= 0) {
        scenarioToLoadId = intScenarioToLoadId;
      }
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

    airspaceIds = scenario.airspaces.map((airspace) => airspace.openAIPId);
    airportIds = scenario.airports.map((airport) => airport.openAIPId);
  }

  return (
    <PlanPageComponent
      existingRouteId={scenarioToLoadId}
      waypoints={waypoints}
      airspaceIds={airspaceIds}
      airportIds={airportIds}
    />
  );
}
