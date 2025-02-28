import { Airport } from "./airport";
import { Airspace } from "./airspace";

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

export function airportDataToAirport(airportData: AirportData): Airport {
  return {
    id: airportData._id,
    name: airportData.name,
    icaoCode: airportData.icaoCode,
    iataCode: airportData.iataCode,
    altIdentifier: airportData.altIdentifier,
    type: airportData.type,
    country: airportData.country,
    coordinates: airportData.geometry.coordinates,
    reportingPoints: airportData.reportingPoints,
    elevation: airportData.elevation.value,
    trafficType: airportData.trafficType,
    ppr: airportData.ppr,
    private: airportData.private,
    skydiveActivity: airportData.skydiveActivity,
    winchOnly: airportData.winchOnly,
    runways: airportData.runways?.map((runway) => {
      return {
        designator: runway.designator,
        trueHeading: runway.trueHeading,
        alignedTrueNorth: runway.alignedTrueNorth,
        operations: runway.operations,
        mainRunway: runway.mainRunway,
        turnDirection: runway.turnDirection,
        landingOnly: runway.landingOnly,
        takeOffOnly: runway.takeOffOnly,
        length: runway.dimension.length.value,
        lengthUnit: runway.dimension.length.unit,
        width: runway.dimension.width.value,
        widthUnit: runway.dimension.width.unit,
        tora: runway.declaredDistance.tora?.value,
        toraUnit: runway.declaredDistance.tora?.unit,
        toda: unway.declaredDistance.toda?.value,
        todaUnit: runway.declaredDistance.toda?.unit,
        asda: runway.declaredDistance.asda?.value,
        asdaUnit: runway.declaredDistance.asda?.unit,
        lda: runway.declaredDistance.lda?.value,
        ldaUnit: runway.declaredDistance.lda?.unit,
        thresholdCoordinates: runway.thresholdLocation?.geometry.coordinates,
        thresholdElevation: runway.thresholdLocation?.elevation.value,
        thresholdElevationUnit: runway.thresholdLocation?.elevation.unit,
        exclusiveAircraftType: runway.exclusiveAircraftType,
        pilotCtrlLighting: runway.pilotCtrlLighting,
        lightingSystem: runway.lightingSystem,
        visualApproachAids: runway.visualApproachAids,
      };
    }),
    frequencies: airportData.frequencies?.map((frequency) => {
      return {
        value: frequency.value,
        unit: frequency.unit,
        name: frequency.name,
        type: frequency.type,
        primary: frequency.primary,
      };
    }),
  };
}

export function airspaceDataToAirspace(airspaceData: AirspaceData): Airspace {
  return {
    id: airspaceData._id,
    name: airspaceData.name,
    type: airspaceData.type,
    icaoClass: airspaceData.icaoClass,
    activity: airspaceData.activity,
    onDemand: airspaceData.onDemand,
    onRequest: airspaceData.onRequest,
    byNotam: airspaceData.byNotam,
    specialAgreement: airspaceData.specialAgreement,
    requestCompliance: airspaceData.requestCompliance,
    coordinates: airspaceData.geometry.coordinates,
    country: airspaceData.country,
    upperLimit: airspaceData.upperLimit.value,
    lowerLimit: airspaceData.lowerLimit.value,
    upperLimitMax: airspaceData.upperLimitMax?.value,
    lowerLimitMin: airspaceData.lowerLimitMin?.value,
    frequencies: airspaceData.frequencies?.map((frequency) => {
      return {
        value: frequency.value,
        unit: frequency.unit,
        name: frequency.name,
        type: 0,
        primary: frequency.primary,
      };
    }),
  };
}
