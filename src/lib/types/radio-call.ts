import { type Waypoint } from "./waypoint";

export type RadioMessageAttempt = {
  message: string;
  mistakes?: string[];
};

export type RadioCall = {
  attempts: RadioMessageAttempt[];
  atc_message: string;
  seed: number;
  scenarioPointIndex: number;
  scenarioPointStage: string;

  prefix: string;
  userCallsign: string;
  userCallsignModified: boolean;
  squark: boolean;
  currentTarget: string;
  currentTargetFrequency: string;
  currentRadioFrequency: string;
  currentTransponderFrequency: string;
  aircraftType: string;

  closestVRP: Waypoint | undefined;
};
