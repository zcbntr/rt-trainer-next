export type AirportReportingPointDBData = {
  name: string;
  coordinates: [number, number];
  compulsory: boolean;
};

export type OperatingHours = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sunrise: boolean;
  sunset: boolean;
  byNotam: boolean;
  publicHolidaysExcluded: boolean;
  remarks: string;
};

export type AirportData = {
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
  reportingPoints: AirportReportingPointDBData[]; // Not in OpenAIP original data
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
  runways: RunwayData[];
  hoursOfOperation: OperatingHours[];
};

export type AirspaceData = {
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

export type AirportReportingPointData = {
  _id: string;
  name: string;
  compulsory: boolean;
  country: string;
  point: [number, number];
  elevation: {
    value: number;
    unit: number;
    referenceDatum: number;
  };
  elevationGeoid: {
    hae: number;
    geoidHeight: number;
  };
  airports: string[];
  remarks: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
