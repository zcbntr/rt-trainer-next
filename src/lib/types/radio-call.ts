import { type Feedback } from "./feedback";
import { type Waypoint } from "./waypoint";

export type RadioMessageAttempt = {
  message: string;
  feedback: Feedback;
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
