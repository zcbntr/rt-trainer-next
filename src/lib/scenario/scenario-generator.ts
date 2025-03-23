import { type Airport } from "../types/airport";
import { type Airspace } from "../types/airspace";
import { type ScenarioPoint } from "../types/scenario";
import { type Waypoint } from "../types/waypoint";
import { findIntersections } from "../sim-utils/route";
import { getStartAirportScenarioPoints } from "./scenario-points/start-airport-points";
import { getAirborneScenarioPoints } from "./scenario-points/airborne-points";
import { getEndAirportScenarioPoints } from "./scenario-points/end-airport-points";

export function generateScenario(
  seed: string,
  callsign: string,
  waypoints: Waypoint[],
  airports: Airport[],
  airspaces: Airspace[],
  hasEmergency: boolean,
  prefix?: string,
): ScenarioPoint[] {
  if (!airspaces || airspaces.length === 0) {
    throw new Error("No airspaces found");
  }

  if (!waypoints || waypoints.length === 0) {
    throw new Error("No waypoints found");
  }

  const scenarioPoints: ScenarioPoint[] = [];

  const startAirport = airports.find(
    (x) => x._id === waypoints[0]?.referenceObjectId,
  );

  const endAirport = airports.find(
    (x) => x._id === waypoints[waypoints.length - 1]?.referenceObjectId,
  );

  // Get all airspace along the route
  const route: [number, number][] = waypoints.map((x) => x.location);

  // Collect all intersection points with airspaces
  const intersectionPoints = findIntersections(route, airspaces);

  if (startAirport)
    scenarioPoints.push(
      ...getStartAirportScenarioPoints(
        seed,
        callsign,
        waypoints,
        airspaces,
        startAirport,
        prefix,
      ),
    );

  scenarioPoints.push(
    ...getAirborneScenarioPoints(
      scenarioPoints.length,
      seed,
      waypoints,
      airspaces,
      intersectionPoints,
      startAirport,
      endAirport,
      scenarioPoints[scenarioPoints.length - 1]!,
      hasEmergency,
    ),
  );

  if (endAirport)
    scenarioPoints.push(
      ...getEndAirportScenarioPoints(
        scenarioPoints.length,
        seed,
        waypoints,
        airspaces,
        endAirport,
        scenarioPoints[scenarioPoints.length - 1]!,
      ),
    );

  return scenarioPoints;
}
