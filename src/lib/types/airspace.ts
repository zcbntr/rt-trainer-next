import { type OperatingHours } from "./operating-hours";

export type Airspace = {
  _id: string;
  name: string;
  dataIngestion: boolean;
  type: number;
  icaoClass: number;
  activity: number;
  onDemand: boolean;
  onRequest: boolean;
  byNotam: boolean;
  specialAgreement: boolean;
  requestCompliance: boolean;
  centrePoint: [number, number];
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  country: string;
  upperLimit: {
    value: number;
    unit: number;
    referenceDatum: number;
  };
  lowerLimit: {
    value: number;
    unit: number;
    referenceDatum: number;
  };
  upperLimitMax: {
    value: number;
    unit: number;
    referenceDatum: number;
  };
  lowerLimitMin: {
    value: number;
    unit: number;
    referenceDatum: number;
  };
  frequencies: [
    {
      _id: string;
      value: string;
      unit: number;
      name: string;
      primary: boolean;
      remarks: string;
    },
  ];
  hoursOfOperation: {
    operatingHours: OperatingHours[];
    remarks: string;
  };
  activeFrom: string;
  activeUntil: string;
  remarks: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
