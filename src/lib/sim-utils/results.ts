import { type RadioCall } from "../types/radio-call";
import {
  AirborneStage,
  LandingStage,
  StartAerodromeStage,
} from "../scenario/stages";

export function getStartUpAndTaxiCalls(radioCalls: RadioCall[]): RadioCall[] {
  if (radioCalls.length === 0) {
    return [];
  }

  return radioCalls.filter((calls) =>
    Object.values(StartAerodromeStage).includes(calls.scenarioPointStage),
  );
}

export function getAirborneCalls(radioCalls: RadioCall[]): RadioCall[] {
  if (radioCalls.length === 0) {
    return [];
  }

  return radioCalls.filter((calls) =>
    Object.values(AirborneStage).includes(calls.scenarioPointStage),
  );
}

export function getLandingCalls(radioCalls: RadioCall[]): RadioCall[] {
  if (radioCalls.length === 0) {
    return [];
  }

  return radioCalls.filter((calls) =>
    Object.values(LandingStage).includes(calls.scenarioPointStage),
  );
}
