export type AirportReportingPoint = {
  _id: string;
  name: string;
  compulsory: boolean;
  country: string;
  point: [number, number];
  elevation: { value: number; unit: number; referenceDatum: number };
  elevationGeoid: { hae: number; geoidHeight: number };
  airports: string[];
  remarks: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
