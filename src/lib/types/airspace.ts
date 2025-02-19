import { type Frequency } from "./frequency";

export type Airspace = {
  id: string;
  name: string;
  type: number;
  icaoClass: number;
  activity: number;
  onDemand: boolean;
  onRequest: boolean;
  byNotam: boolean;
  specialAgreement: boolean;
  requestCompliance: boolean;
  coordinates: [number, number][][];
  country: string;
  upperLimit: number;
  lowerLimit: number;
  upperLimitMax: number;
  lowerLimitMin: number;
  frequencies: Frequency[];
};
