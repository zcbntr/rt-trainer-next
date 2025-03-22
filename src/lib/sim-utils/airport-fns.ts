import * as turf from "@turf/turf";
import { getRandomFrequencyFromSeed, getSeededTimeInMinutes } from ".";
import { type Position } from "geojson";
import { type Airport } from "../types/airport";
import { type Runway } from "../types/runway";
import { type Frequency } from "../types/frequency";
import { type METORData } from "../types/metor-data";
import { seedStringToNumber } from "../utils";

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
  if (runways.length == 0) {
    throw new Error("No suitable takeoff runway found - no runways provided");
  }

  // Local variable needed to avoid ts(2532)
  let chosenRunway: Runway | undefined = undefined;
  let iterations = 0;
  let index = seed % runways.length;
  while (runways[index]?.landingOnly) {
    chosenRunway = runways[index];
    index = (index + 1) % runways.length;
    iterations++;
    if (iterations > runways.length) {
      break;
    }
  }

  if (chosenRunway != undefined) {
    return chosenRunway;
  } else {
    throw new Error(
      "No suitable takeoff runway found in provided runways array",
    );
  }
}

// Needs to be implemented for each aerodrome depending on when pilots move to next frequency from takeoff
export function getTakeoffTransitionAltitude(_airport: Airport): number {
  throw new Error("Not implemented");
}

/**
 * Gets a runway suitable for landing based on the seed and the available runways
 * @param runways - List of available runways
 * @param seed - Seed of the scenario
 * @returns Runway suitable for landing
 */
export function getLandingRunwayFromSeed(
  runways: Runway[],
  seed: number,
): Runway {
  if (runways.length == 0) {
    throw new Error("No suitable landing runway found - no runways provided");
  }

  // Local variable needed to avoid ts(2532)
  let chosenRunway: Runway | undefined = undefined;
  let iterations = 0;
  let index = seed % runways.length;
  while (runways[index]?.takeOffOnly) {
    chosenRunway = runways[index];
    index = (index + 1) % runways.length;
    iterations++;
    if (iterations > runways.length) {
      throw new Error(
        "No suitable landing runway found in provided runways array",
      );
    }
  }

  if (chosenRunway != undefined) {
    return chosenRunway;
  } else {
    throw new Error(
      "No suitable landing runway found in provided runways array",
    );
  }
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
): Position {
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
    groundOrInformationFrequency = {
      value: getRandomFrequencyFromSeed(
        seedStringToNumber(airport._id),
        airport._id,
      ),
      unit: 9,
      name: "Ground",
      type: 9,
      primary: true,
    };
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
  if (lat > 90 || lat < -90) {
    throw new Error("Invalid latitude provided");
  }

  if (elevation < 0 || elevation > 8848) {
    throw new Error("Invalid elevation provided");
  }

  /* Based on a simple model of temperature used by David Waltham in his blog to 
    illustrate the effects of global warming in a simple model.

    T = To – a.sin^2λ
    Where To = average equatorial temp, a = constant, λ = latitude 

    More info:
    https://davidwaltham.com/global-warming-model/
    */

  const meanTemp = 30 - 30 * Math.pow(Math.sin((lat * Math.PI) / 180), 2);

  const data: METORData = {
    avgWindDirection: 180,
    meanWindSpeed: 15,
    stdWindSpeed: 8,
    meanPressure: 1013.25 * Math.pow(1 - (6.5 * elevation) / 288150, 5.255),
    stdPressure: 0.5,
    meanTemperature: meanTemp,
    stdTemperature: 5,
    meanDewpoint: meanTemp,
    stdDewpoint: 1,
  };

  return data;
}
