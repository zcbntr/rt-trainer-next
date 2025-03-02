import { type Airport } from "../types/airport";
import { type Airspace } from "../types/airspace";
import {
  type AirportReportingPointData,
  type AirportData,
  type AirspaceData,
  airspaceDataToAirspace,
  airportDataToAirport,
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

export async function getAllUKAirportsFromOpenAIP(): Promise<AirportData[]> {
  try {
    if (!process.env.OPENAIPKEY) {
      throw new Error("OPENAIPKEY is not defined in the environment");
    }

    const response = await fetch(
      `https://api.core.openaip.net/api/airports?page=1&sortBy=geometry.coordinates%5B0%5D&sortDesc=false&country=GB&searchOptLwc=false&type=0&type=2&type=3&type=9`,
      {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
          "x-openaip-api-key": process.env.OPENAIPKEY,
        }),
      },
    );

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch airports from OpenAIP: ${response.statusText}`,
      );
    }

	const data = await response.json();

    return [...data.items] as AirportData[];
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
      `https://api.core.openaip.net/api/airspaces?page=1&sortBy=geometry.coordinates%5B0%5D%5B0%5D%5B0%5D&sortDesc=false&country=GB&searchOptLwc=false&icaoClass=1&icaoClass=2&icaoClass=3&icaoClass=4&icaoClass=5&icaoClass=6&icaoClass=8&onDemand=false&onRequest=false&byNotam=false&specialAgreement=false`,
      {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
          "x-openaip-api-key": process.env.OPENAIPKEY,
        }),
      },
    );

    if (response1.status !== 200) {
      throw new Error(
        `Failed to fetch airspace from OpenAIP: ${response1.statusText}`,
      );
    }

    const data = await response1.json();

    return [...data.items] as AirspaceData[];
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
		method: "GET",
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
