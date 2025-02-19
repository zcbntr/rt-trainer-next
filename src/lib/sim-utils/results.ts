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

  const startAreodromStages = [
    ...Object.values(StartAerodromeStage.StartUpStage).map((x) => x.toString()),
    ...Object.values(StartAerodromeStage.TaxiStage).map((x) => x.toString()),
    ...Object.values(StartAerodromeStage.TakeOffStage).map((x) => x.toString()),
  ];

  return radioCalls.filter((calls) =>
    startAreodromStages.includes(calls.scenarioPointStage),
  );
}

export function getAirborneCalls(radioCalls: RadioCall[]): RadioCall[] {
  if (radioCalls.length === 0) {
    return [];
  }

  throw new Error("Not implemented");

  //   To Fix
  //   const airborneStages = [
  //     ...Object.values(AirborneStage).map((x) => x.toString()),
  //   ];

  //   return radioCalls.filter((calls) =>
  //     airborneStages.includes(calls.scenarioPointStage),
  //   );
}

export function getLandingCalls(radioCalls: RadioCall[]): RadioCall[] {
  if (radioCalls.length === 0) {
    return [];
  }

  const landingStages = [
    ...Object.values(LandingStage.InboundForJoinStage).map((x) => x.toString()),
    ...Object.values(LandingStage.CircuitAndLandingStage).map((x) =>
      x.toString(),
    ),
    ...Object.values(LandingStage.LandingToParkedStage).map((x) =>
      x.toString(),
    ),
  ];

  return radioCalls.filter((calls) =>
    landingStages.includes(calls.scenarioPointStage),
  );
}
