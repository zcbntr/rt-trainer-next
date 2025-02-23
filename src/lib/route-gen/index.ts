import * as turf from "@turf/turf";
import { type Airport } from "../types/airport";
import { type Airspace } from "../types/airspace";
import { seedStringToNumber } from "../utils";
import { type Waypoint } from "~/lib/types/waypoint";

export function generateFRTOLRouteFromSeed(
  seedString: string,
  airports: Airport[],
  airspaces: Airspace[],
  maxFL: number,
): RouteData {
  // Validate arguments
  if (
    seedString === "" ||
    !airports ||
    airports.length === 0 ||
    !airspaces ||
    airspaces.length === 0
  ) {
    return undefined;
  }

  const seed: number = seedStringToNumber(seedString);
  const maxIterations = 2000;
  let startAirport: Airport | undefined;
  let startAirportIsControlled = false;
  let destinationAirport: Airport | undefined;
  let chosenMATZ: Airspace | undefined;
  let matzEntryPoint: [number, number] | undefined;
  let matzExitPoint: [number, number] | undefined;
  let onRouteAirspace: Airspace[] = [];

  let validRoute = false;
  let iterations = 0;

  while (!validRoute && iterations < maxIterations) {
    iterations++;
    validRoute = true;

    startAirport =
      airports[
        Math.floor(Math.abs(seed * 987654321 + iterations * 123456789)) %
          airports.length
      ];
    if (!startAirport) throw new Error("Start airport undefined in route gen");

    if (startAirport.type == 3 || startAirport.type == 9) {
      startAirportIsControlled = true;
    }

    // Get all valid MATZ from within 40km of start airport and not inside the ATZ of the start airport
    const nearbyMATZs: Airspace[] = airspaces.filter(
      (x) =>
        x.type == 14 &&
        turf.distance(startAirport?.coordinates, x.coordinates[0][0], {
          units: "kilometers",
        }) < 40 &&
        !x.pointInsideATZ((startAirport as Airport).coordinates),
    );
    if (nearbyMATZs.length == 0) {
      validRoute = false;
      continue;
    }

    // Choose a MATZ to fly through
    chosenMATZ =
      nearbyMATZs[
        Math.floor(Math.abs(seed * 876543219 + iterations * 234567891)) %
          nearbyMATZs.length
      ];

    if (chosenMATZ.pointInsideATZ(startAirport.coordinates)) {
      validRoute = false;
      continue;
    }

    // Get airports within 100km of the chosen MATZ
    const possibleDestinations: Airport[] = [];

    // Could be turned into a filter
    for (let i = 0; i < airports.length; i++) {
      const airport = airports[i];
      const distance = turf.distance(
        chosenMATZ.coordinates[0][0],
        airport.coordinates,
        {
          units: "kilometers",
        },
      );

      if (
        (airport.type == 0 ||
          airport.type == 2 ||
          airport.type == 3 ||
          airport.type == 9) &&
        distance < 100
      )
        possibleDestinations.push(airport);
    }

    if (possibleDestinations.length == 0) {
      validRoute = false;
      continue;
    }

    // Choose a destination airport
    let validDestinationAirport = false;
    let destIterations = -1;
    while (
      !validDestinationAirport &&
      destIterations < possibleDestinations.length
    ) {
      destIterations++;
      destinationAirport =
        possibleDestinations[
          Math.floor(Math.abs(seed * 765432198 + iterations * 345678912)) %
            possibleDestinations.length
        ];

      if (!destinationAirport)
        throw new Error("Destination airport undefined in route gen");

      if (!chosenMATZ.pointInsideATZ(destinationAirport.coordinates)) {
        if (
          startAirportIsControlled &&
          destinationAirport.type != 3 &&
          startAirport != destinationAirport
        ) {
          validDestinationAirport = true;
        } else if (
          !startAirportIsControlled &&
          (destinationAirport.type == 3 || destinationAirport.type == 9) &&
          startAirport != destinationAirport
        ) {
          validDestinationAirport = true;
        }
      }
    }
    if (
      destIterations >= possibleDestinations.length ||
      destinationAirport == undefined ||
      validDestinationAirport == false
    ) {
      validRoute = false;
      continue;
    }

    const matzCoords: number[][] = chosenMATZ.coordinates[0].map((point) =>
      turf.point([point[0], point[1]]),
    );

    matzEntryPoint = turf.nearestPoint(
      turf.point(startAirport.coordinates),
      turf.featureCollection(matzCoords),
    ).geometry.coordinates as [number, number];
    matzExitPoint = turf.nearestPoint(
      turf.point(destinationAirport.coordinates),
      turf.featureCollection(matzCoords),
    ).geometry.coordinates as [number, number];

    if (matzEntryPoint == matzExitPoint) {
      validRoute = false;
      continue;
    }

    // Get all airspace along the route
    const route: [number, number][] = [
      startAirport.coordinates,
      matzEntryPoint,
      matzExitPoint,
      destinationAirport.coordinates,
    ];
    onRouteAirspace = [];
    for (let i = 0; i < airspaces.length; i++) {
      const airspace: Airspace = airspaces[i];
      if (airspace.isIncludedInRoute(route, maxFL)) {
        if (
          airspace.type == 1 ||
          (airspace.type == 14 && airspace != chosenMATZ)
        ) {
          validRoute = false;
          break;
        }
        if (airspace != chosenMATZ) onRouteAirspace.push(airspace);
      }
    }
    onRouteAirspace.push(chosenMATZ);

    if (onRouteAirspace.length > 5 || onRouteAirspace.length < 2) {
      validRoute = false;
      continue;
    }
  }

  if (iterations >= maxIterations || !chosenMATZ || !startAirport) {
    console.log(`Could not find a valid route after ${iterations} iterations`);
    return;
  }

  console.log("Iterations: ", iterations);

  const startWaypoint: Waypoint = new Waypoint(
    startAirport.name,
    startAirport.coordinates,
    WaypointType.Airport,
    0,
    startAirport.id,
  );

  if (!matzEntryPoint) throw new Error("MATZ entry point is undefined");
  const matzEntryWaypoint: Waypoint = new Waypoint(
    chosenMATZ.getDisplayName() + " Entry",
    matzEntryPoint,
    WaypointType.NewAirspace,
    1,
  );

  if (!matzExitPoint) throw new Error("MATZ exit point is undefined");
  const matzExitWaypoint: Waypoint = new Waypoint(
    chosenMATZ.getDisplayName() + " Exit",
    matzExitPoint,
    WaypointType.NewAirspace,
    2,
  );

  if (destinationAirport == undefined)
    throw new Error("Destination airport is undefined");
  const endWaypoint: Waypoint = new Waypoint(
    destinationAirport.name,
    destinationAirport.coordinates,
    WaypointType.Airport,
    3,
    destinationAirport.id,
  );

  return {
    waypoints: [
      startWaypoint,
      matzEntryWaypoint,
      matzExitWaypoint,
      endWaypoint,
    ],
    airspaces: onRouteAirspace,
    airports: [startAirport, destinationAirport],
  };
}
