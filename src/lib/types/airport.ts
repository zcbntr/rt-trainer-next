import { type OperatingHours } from "./operating-hours";
import { type Runway } from "./runway";

export type Airport = {
  _id: string;
  name: string;
  icaoCode: string;
  iataCode: string;
  altIdentifier: string;
  type: number;
  country: string;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  elevation: {
    value: number;
    unit: string;
    referenceDatum: number;
  };
  elevationGeoid: {
    hae: number;
    geoidHeight: number;
  };
  trafficType: number[];
  magneticDeclination: 0;
  ppr: boolean;
  private: boolean;
  skydiveActivity: boolean;
  winchOnly: boolean;
  services: {
    fuelTypes: string[];
    gliderTowing: string[];
    handlingFacilities: string[];
    passengerFacilities: string[];
  };
  frequencies: {
    _id: string;
    value: string;
    unit: number;
    type: 0;
    name: string;
    primary: boolean;
    publicUse: boolean;
  }[];
  runways: Runway[];
  hoursOfOperation: OperatingHours[];
};
