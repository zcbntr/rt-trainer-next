import { type Airport } from "../types/airport";
import { type Airspace } from "../types/airspace";
import {
  type AirportReportingPointData,
  type AirportData,
  type AirspaceData,
} from "../types/open-aip";

export async function getAllValidAirspaceData(): Promise<Airspace[]> {
  const airspaceData = await getAllUKAirspaceFromOpenAIP();
  const airspaces = airspaceData.map((airspaceData) =>
    airspaceDataToAirspace(airspaceData),
  );
  return airspaces;
}

export async function getAllValidAirportData(): Promise<Airport[]> {
  const airportData = await getAllUKAirportsFromOpenAIP();
  const airports = airportData.map((airportData) =>
    airportDataToAirport(airportData),
  );
  airports.filter((airport) => airport.runways && airport.runways.length > 0);
  return airports;
}

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

export async function getAllUKAirportsFromOpenAIP(): Promise<AirportData[]> {
  try {
    if (!process.env.OPENAIPKEY) {
      throw new Error("OPENAIPKEY is not defined in the environment");
    }

    const response = await fetch(`https://api.core.openaip.net/api/airports`, {
      headers: new Headers({
        "Content-Type": "application/json",
        "x-openaip-api-key": process.env.OPENAIPKEY,
      }),
      body: new URLSearchParams({
        country: "GB",
        type: "[0, 2, 3, 9]",
        sortBy: "geometry.coordinates[0]",
      }),
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch airports from OpenAIP: ${response.statusText}`,
      );
    }

    return response.data.items as AirportData[];
  } catch (error: unknown) {
    console.error("Error: ", error);
  }
  return [];
}

export async function getAllUKAirspaceFromOpenAIP(): Promise<AirspaceData[]> {
  try {
    if (!process.env.OPENAIPKEY) {
      throw new Error("OPENAIPKEY is not defined in the environment");
    }

    const response1 = await fetch(
      `https://api.core.openaip.net/api/airspaces`,
      {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
          "x-openaip-api-key": process.env.OPENAIPKEY,
        }),
        body: new URLSearchParams({
          page: "1",
          country: "GB",
          icaoClass: "[1, 2, 3, 4, 5, 6, 8]",
          onDemand: "false",
          onRequest: "false",
          byNotam: "false",
          sortBy: "geometry.coordinates[0][0][0]",
        }),
      },
    );

    if (response1.status !== 200) {
      throw new Error(
        `Failed to fetch airspace from OpenAIP: ${response1.statusText}`,
      );
    }

    return [...response1.data.items] as AirspaceData[];
  } catch (error: unknown) {
    console.error("Error: ", error);
  }
  return [];
}

export async function getAllUKAirportReportingPointsFromOpenAIP(): Promise<
  AirportReportingPointData[]
> {
  try {
    if (!process.env.OPENAIPKEY) {
      throw new Error("OPENAIPKEY is not defined in the environment");
    }

    const response = await fetch(
      `https://api.core.openaip.net/api/reporting-points`,
      {
        headers: new Headers({
          "Content-Type": "application/json",
          "x-openaip-api-key": process.env.OPENAIPKEY,
        }),
        body: new URLSearchParams({
          country: "GB",
          sortBy: "geometry.coordinates[0]",
        }),
      },
    );

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch reporting points from OpenAIP: ${response.statusText}`,
      );
    }

    return response.data.items as AirportReportingPointData[];
  } catch (error: unknown) {
    console.error("Error: ", error);
  }
  return [];
}
