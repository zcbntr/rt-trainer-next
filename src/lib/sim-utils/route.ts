import type { Position } from "geojson";
import * as turf from "@turf/turf";
import { type Airspace } from "../types/airspace";
import { getAirspaceLowerLimitFL } from "./airspaces";
import { Airport } from "../types/airport";
import { Waypoint } from "../types/waypoint";

export function kmToUnit(km: number, unit: string): number {
  switch (unit) {
    case "km":
      return km;
    case "nm":
      return km * 0.539957;
    case "mi":
      return km * 0.621371;
    default:
      return km;
  }
}

export function getAirspaceDisplayName(airspace: Airspace): string {
  if (airspace.type == 14) {
    return airspace.name + " MATZ";
  } else {
    return airspace.name + " ATZ";
  }
}

/**
 * Calculates the distance along a route a given target point in meters
 * @param route - route defined as array of Positions
 * @param targetPoint - target point on route
 * @returns - distance along the route in meters
 */
export function calculateDistanceAlongRoute(
  route: Position[],
  targetPoint: Position,
): number {
  let totalDistanceAlongRoute = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const currentPoint = route[i];
    const nextPoint = route[i + 1];

    if (!currentPoint || !nextPoint) {
      throw new Error("Invalid route");
    }

    const segmentLength = turf.distance(currentPoint, nextPoint, {
      units: "meters",
    });

    // Check if the target point is between the current segment
    const distanceToTarget = turf.distance(currentPoint, targetPoint, {
      units: "meters",
    });
    const distanceToNext = turf.distance(nextPoint, targetPoint, {
      units: "meters",
    });

    // If the target point is within 5m of the segment, we consider it to be on the segment
    if (distanceToTarget + distanceToNext - segmentLength < 5) {
      // Target point lies on the current segment
      totalDistanceAlongRoute += distanceToTarget;
      break;
    }

    // Add the distance of the current segment to the total distance
    totalDistanceAlongRoute += segmentLength;
  }

  return totalDistanceAlongRoute;
}

export interface Intersection {
  position: Position;
  airspaceId: string;
  enteringAirspace: boolean; // True if the intersection is the entering of an airspace, false if it is the exiting
  distanceAlongRoute: number;
}

/**
 * Finds the intersections between a route and a list of airspaces, returning the intersections sorted by distance along the route
 * @param route - route defined as array of Positions
 * @param airspaces - list of airspaces
 * @returns - list of intersections sorted by distance along the route
 */
export function findIntersections(
  route: Position[],
  airspaces: Airspace[],
): Intersection[] {
  const routeLine = turf.lineString(route);

  const intersections: Intersection[] = [];

  airspaces.forEach((airspace) => {
    if (getAirspaceLowerLimitFL(airspace) > 30) return;

    const airspacePolygon = turf.polygon(airspace.geometry.coordinates);
    if (turf.booleanIntersects(routeLine, airspacePolygon)) {
      route.forEach((point, pointIndex) => {
        if (pointIndex < route.length - 1) {
          const nextPoint = route[pointIndex + 1];
          if (!nextPoint) {
            throw new Error("Invalid route tested againt for intersections");
          }

          const lineSegment = turf.lineString([point, nextPoint]);

          if (turf.booleanIntersects(lineSegment, airspacePolygon)) {
            const intersection = turf.lineIntersect(
              lineSegment,
              airspacePolygon,
            );
            intersection.features.forEach((feature) => {
              const intersectionPoint: Position = feature.geometry.coordinates;

              const distanceAlongRoute = calculateDistanceAlongRoute(
                route,
                intersectionPoint,
              );

              const heading = turf.bearing(
                turf.point(point),
                intersectionPoint,
              );

              // Determine whether the intersection is the entering of an airspace by defining a point 50m
              // in the direction of the heading and checking if it is inside the airspace
              const enteringAirspace = turf.booleanPointInPolygon(
                turf.destination(intersectionPoint, 0.005, heading, {
                  units: "kilometers",
                }),
                airspacePolygon,
              );

              intersections.push({
                position: intersectionPoint,
                airspaceId: airspace._id,
                enteringAirspace,
                distanceAlongRoute,
              });
            });
          }
        }
      });
    }
  });

  intersections.sort((a, b) => a.distanceAlongRoute - b.distanceAlongRoute);

  return intersections;
}

/**
 * Checks if a point is inside an airspace using the Turf library
 * @remarks The function first checks if the airspace's lower limit is greater than the max flight level, if so it returns false
 * @param point - point to check
 * @param airspace - airspace to check against
 * @returns - true if the point is inside the airspace, false otherwise
 */
export function isInAirspace(
  point: Position,
  airspace: Airspace,
  maxFlightLevel = 30,
): boolean {
  if (getAirspaceLowerLimitFL(airspace) > maxFlightLevel) return false;

  return turf.booleanPointInPolygon(
    point,
    turf.polygon(airspace.geometry.coordinates),
  );
}

/**
 * Checks if an airspace is included in a route using the Turf library
 * @remarks The function first checks if the route has more than one point, if so it checks if the route intersects the airspace
 * @remarks If the airspace's lower limit is greater than the max flight level, it returns false
 * @param route - route defined as array of Positions
 * @param airspace - airspace to check against
 * @param maxFlightLevel - maximum flight level
 * @returns - true if the airspace is included in the route, false otherwise
 */
export function isAirspaceIncludedInRoute(
  route: Position[],
  airspace: Airspace,
  maxFlightLevel = 30,
): boolean {
  if (route.length > 1) {
    const routeLine = turf.lineString(route);
    if (
      turf.booleanIntersects(
        routeLine,
        turf.polygon(airspace.geometry.coordinates),
      )
    )
      return true;
  }

  // If the airspace's lower limit is greater than the max flight level, return false
  if (getAirspaceLowerLimitFL(airspace) > maxFlightLevel) return false;

  for (const point of route) {
    if (
      turf.booleanContains(
        turf.polygon(airspace.geometry.coordinates),
        turf.point(point),
      )
    )
      return true;
  }

  return false;
}

export function getRouteIssues(
  waypoints: Waypoint[],
  airspaces: Airspace[],
  airports: Airport[],
): string[] {
  const issues = [];

  if (waypoints.length < 2) {
    issues.push("Route has less than 2 waypoints");
  }

  if (airports.length < 2) {
    issues.push("Route has less than 2 airports");
  }

  if (airspaces.length < 1) {
    issues.push("Route has no airspaces");
  }

  return issues;
}
