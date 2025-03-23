import SimPageWrapper from "~/app/_components/sim/sim-page-wrapper";
import { type Waypoint } from "~/lib/types/waypoint";
import { api, HydrateClient } from "~/trpc/server";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const startPointIndexSearchParam = (await searchParams).startPointIndex;
  const endPointIndexSearchParam = (await searchParams).endPointIndex;

  let scenarioToLoadId: number | undefined = undefined;
  let seed: string | undefined = undefined;
  let startIndex: number | undefined = undefined;
  let endIndex: number | undefined = undefined;
  let waypoints: Waypoint[] = [];
  let airspaceIds: string[] = [];
  let airportIds: string[] = [];
  let hasEmergencyEvents = false;

  if (slug && parseInt(slug) >= 0) {
    const intScenarioToLoadId = parseInt(slug);
    if (intScenarioToLoadId > 0) {
      scenarioToLoadId = intScenarioToLoadId;
    } else {
      return <ScenarioNotFound />;
    }

    // get scenario data from db
    const scenario = await api.scenario.getOwnedScenarioById({
      id: scenarioToLoadId,
    });

    if (!scenario) {
      return <ScenarioNotFound />;
    }

    seed = scenario.seed;

    hasEmergencyEvents = scenario.hasEmergencyEvents;

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

    const startIndexInt = parseInt(startPointIndexSearchParam as string);
    if (startIndexInt >= 0) {
      startIndex = startIndexInt;
    }

    // Check if its within a reasonable number of scenario points - no idea if this is a good upper limit
    const endIndexInt = parseInt(endPointIndexSearchParam as string);
    if (
      endIndexInt >= 0 &&
      endIndexInt < airportIds.length * 10 + airspaceIds.length * 10 + 10
    ) {
      endIndex = endIndexInt;
    }
  } else {
    return <ScenarioNotFound />;
  }

  return (
    <HydrateClient>
      <SimPageWrapper
        scenarioId={scenarioToLoadId}
        callsign={"G-OFLY"}
        prefix={"STUDENT"}
        seed={seed}
        waypoints={waypoints}
        airspaceIds={airspaceIds}
        airportIds={airportIds}
        startIndex={startIndex}
        endIndex={endIndex}
        hasEmergencyEvents={hasEmergencyEvents}
      />
    </HydrateClient>
  );
}

const ScenarioNotFound = () => {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col place-content-center">
        Scenario not found
      </div>
    </div>
  );
};
