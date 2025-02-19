import { type AirportReportingPoint } from "./reporting-point";

/* Airport data. */
export type Airport = {
  id: string;
  name: string;
  icaoCode: string;
  iataCode: string;
  altIdentifier: string;
  type: number;
  country: string;
  coordinates: [number, number];
  reportingPoints: AirportReportingPoint[];
  elevation: number;
  trafficType: number[];
  ppr: boolean;
  private: boolean;
  skydiveActivity: boolean;
  winchOnly: boolean;
};
