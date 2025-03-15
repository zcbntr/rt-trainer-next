import { type Airport } from "../types/airport";
import { type Airspace } from "../types/airspace";
import { type ScenarioPoint } from "../types/scenario";
import { type Waypoint } from "../types/waypoint";
import {
  getStartAirportScenarioPoints,
  getAirborneScenarioPoints,
  getEndAirportScenarioPoints,
} from "./scenario-points";
import { findIntersections } from "../sim-utils/route";

export function generateScenario(
  seed: string,
  waypoints: Waypoint[],
  airports: Airport[],
  airspaces: Airspace[],
  hasEmergency: boolean,
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
        waypoints,
        airspaces,
        startAirport,
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
