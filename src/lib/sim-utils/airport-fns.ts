import * as turf from "@turf/turf";
import Airport from "../interfaces/airport";

/**
 * Gets a runway suitable for takeoff based on the seed and the available runways
 * @param runways - List of available runways
 * @param seed - Seed of the scenario
 * @returns Runway suitable for takeoff
 */
export function getTakeoffRunwayFromSeed(
  runways: Runway[],
  seed: number,
): Runway {
  let iterations = 0;
  let index = seed % runways.length;
  while (runways[index].landingOnly) {
    index = (index + 1) % runways.length;
    iterations++;
    if (iterations > runways.length) {
      throw new Error("No suitable takeoff runway found");
    }
  }

  return runways[index];
}

// Needs to be implemented for each aerodrome depending on when pilots move to next frequency from takeoff
export function getTakeoffTransitionAltitude(): number {
  throw new Error("Not implemented");
}

/**
 * Gets a runway suitable for landing based on the seed and the available runways
 * @param runways - List of available runways
 * @param seed - Seed of the scenario
 * @returns Runway suitable for landing
 */
export function getLandingRunway(runways: Runway[], seed: number): Runway {
  let iterations = 0;
  let index = seed % runways.length;
  while (runways[index].takeOffOnly) {
    index = (index + 1) % runways.length;
    iterations++;
    if (iterations > runways.length) {
      throw new Error("No suitable landing runway found");
    }
  }

  return runways[index];
}

/**
 * Gets a point some distance in kilometers from the runway center along the runway vector
 * @param runway - Runway to use
 * @param distance - Distance in kilometers
 * @returns Position of the point
 */
export function getPointAlongRunwayVector(
  runway: Runway,
  distance: number,
): turf.Position {
  return turf.destination(runway.coordinates, distance, runway.trueHeading, {
    units: "kilometers",
  }).geometry.coordinates;
}

/**
 * Gets the start time of the scenario in minutes from midnight, given a seed, assuming it is the takeoff airport of the scenario
 * Range from: 660 (11am) - 900 (3pm)
 * @param seed - Seed of the scenario
 * @returns Time in minutes from midnight
 */
export function getScenarioStartTime(seed: number): number {
  // (In minutes)
  // 1pm + (0-4hours) - 2 hours -> 11am - 3pm
  return getSeededTimeInMinutes(seed, 660, 900);
}

/**
 * Gets the takeoff time of the scenario in minutes from midnight, given a seed, assuming it is the takeoff airport of the scenario
 * @param seed - Seed of the scenario
 * @returns Time in minutes from midnight
 */
export function getScenarioInitialTakeoffTime(seed: number): number {
  return getScenarioStartTime(seed) + 10;
}

export function isAirportControlled(airport: Airport): boolean {
  return airport.type == 3 || airport.type == 9;
}

export function getParkedFrequency(airport: Airport): Frequency | undefined {
  let groundOrInformationFrequency = getGroundFrequency(airport);
  if (groundOrInformationFrequency == undefined) {
    groundOrInformationFrequency = getTowerFrequency(airport);
  }
  if (groundOrInformationFrequency == undefined) {
    groundOrInformationFrequency = getInformationFrequency(airport);
  }
  if (groundOrInformationFrequency == undefined) {
    groundOrInformationFrequency = getAGFrequency(airport);
  }
  if (groundOrInformationFrequency == undefined) {
    groundOrInformationFrequency = new Frequency(
      getRandomFrequency(simpleHash(this.id), this.id),
      9,
      "Ground",
      9,
      true,
    );
  }
  return groundOrInformationFrequency;
}

export function getGroundFrequency(airport: Airport): Frequency | undefined {
  return airport.frequencies?.find((frequency) => frequency.type == 9);
}

export function getInformationFrequency(
  airport: Airport,
): Frequency | undefined {
  return airport.frequencies?.find(
    (frequency) => frequency.type == 15 || frequency.type == 10,
  );
}

export function getAGFrequency(airport: Airport): Frequency | undefined {
  return airport.frequencies?.find((frequency) => frequency.type == 17);
}

export function getTowerFrequency(airport: Airport): Frequency | undefined {
  return airport.frequencies?.find((frequency) => frequency.type == 14);
}

export function getApproachFrequency(airport: Airport): Frequency | undefined {
  return airport.frequencies?.find((frequency) => frequency.type == 0);
}

export function getATISLetterFromSeed(seed: number): string {
  return String.fromCharCode(65 + (seed % 26));
}

export function generateMETORData(lat: number, elevation: number): METORData {
  const avgWindDirection = 180;
  const meanWindSpeed = 15;
  const stdWindSpeed = 8;
  const meanPressure =
    1013.25 * Math.pow(1 - (6.5 * elevation) / 288150, 5.255); // Formula from https://rechneronline.de/physics/air-pressure-altitude.php
  const stdPressure = 0.5;

  /* Based on a simple model of temperature used by David Waltham in his blog to 
    illustrate the effects of global warming in a simple model.

    T = To – a.sin^2λ
    Where To = average equatorial temp, a = constant, λ = latitude 

    More info:
    https://davidwaltham.com/global-warming-model/
    */
  const meanTemperature =
    30 - 30 * Math.pow(Math.sin((lat * Math.PI) / 180), 2);

  const stdTemperature = 5;
  const meanDewpoint = meanTemperature - 3;
  const stdDewpoint = 1;

  return new METORData(
    avgWindDirection,
    meanWindSpeed,
    stdWindSpeed,
    meanPressure,
    stdPressure,
    meanTemperature,
    stdTemperature,
    meanDewpoint,
    stdDewpoint,
  );
}
