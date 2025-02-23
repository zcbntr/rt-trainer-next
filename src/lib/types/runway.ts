export type Runway = {
  designator: string;
  trueHeading: number;
  alignedTrueNorth: boolean;
  operations: number;
  mainRunway: boolean;
  turnDirection: number;
  landingOnly: boolean;
  takeOffOnly: boolean;
  lengthValue: number;
  lengthUnit: number;
  widthValue: number;
  widthUnit: number;
  toraValue: number;
  toraUnit: number;
  todaValue: number;
  todaUnit: number;
  asdaValue: number;
  asdaUnit: number;
  ldaValue: number;
  ldaUnit: number;
  thresholdCoordinates: [number, number];
  elevationValue: number;
  elevationUnit: number;
  exclusiveAircraftType: number[];
  pilotCtrlLighting: boolean;
  lightingSystem: number[];
  visualApproachAids: number[];
};
