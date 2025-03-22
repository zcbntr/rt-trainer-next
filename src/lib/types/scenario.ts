import { type Position } from "geojson";
import { type SimulatorUpdateData } from "./simulator";
import { Frequency } from "./frequency";

export enum EmergencyType {
  None = "None",
  EngineFailure = "Engine Failure",
  RelayEmergency = "Relay Emergency",
}

/* Represents location, heading altitude and airSpeed of the aircraft. Term borrowed from robotics */
export type AircraftPose = {
  position: Position;
  trueHeading: number;
  altitude: number;
  airSpeed: number;
};

export enum FrequencyType {
  Information = "Information",
  Tower = "Tower",
  Ground = "Ground",
  Radar = "Radar",
  None = "None",
}

export enum FlightRules {
  IFR = "IFR", // Instrument Flight Rules
  VFR = "VFR", // Visual Flight Rules
}

export type FrequencyChangePoint = {
  oldAirspaceId: string | undefined;
  newAirspaceId: string | undefined;
  coordinates: [number, number];
};

/* A point on the route used in generation. Not necissarily visible to the user */
export type ScenarioPoint = {
  index: number;
  stage: string;
  pose: AircraftPose;
  nextWaypointIndex: number;
  timeAtPoint: number;
  distanceAlongRoute: number;
  currentContext: string | undefined;
  callsignModified: boolean; // States whether callsign has been modified by ATC, e.g. shortened
  squark: boolean;
  currentTargetFrequency: Frequency;
  currentTransponderFrequency: string;
  currentPressure: number;
  emergency: EmergencyType;
};
