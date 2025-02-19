/* Airport data. */
export default interface Airport {
  id: string;
  name: string;
  icaoCode: string;
  iataCode: string;
  altIdentifier: string;
  type: number;
  country: string;
  coordinates: [number, number];
  reportingPoints: AirportReportingPointDBData[];
  elevation: number;
  trafficType: number[];
  ppr: boolean;
  private: boolean;
  skydiveActivity: boolean;
  winchOnly: boolean;
}
