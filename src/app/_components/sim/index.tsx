/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import { type Waypoint } from "~/lib/types/waypoint";
import React, { useEffect } from "react";
import useAeronauticalDataStore from "~/app/stores/aeronautical-data-store";
import Simulator from "./simulator";
import useScenarioStore from "~/app/stores/scenario-store";
import { generateScenario } from "~/lib/scenario/scenario-generator";
import { type Airspace } from "~/lib/types/airspace";
import { type Airport } from "~/lib/types/airport";

export type SimPageProps = {
  scenarioId?: number;
  seed?: string;
  callsign?: string;
  prefix?: string;
  waypoints?: Waypoint[];
  airspaceIds?: string[];
  airportIds?: string[];
  startIndex?: number;
  endIndex?: number;
  hasEmergencyEvents?: boolean;
};

const SimPageComponent = ({
  scenarioId,
  seed,
  callsign,
  prefix,
  waypoints,
  airspaceIds,
  airportIds,
  startIndex,
  endIndex,
  hasEmergencyEvents,
}: SimPageProps) => {
  const scenarioPoints = useScenarioStore((state) => state.scenarioPoints);
  const setScenarioPoints = useScenarioStore(
    (state) => state.setScenarioPoints,
  );

  const setScenarioId = useScenarioStore((state) => state.setScenarioId);
  const setWaypoints = useScenarioStore((state) => state.setWaypoints);
  const setOnRouteAirspaces = useScenarioStore(
    (state) => state.setAirspacesOnRoute,
  );
  const setOnRouteAirports = useScenarioStore(
    (state) => state.setAirportsOnRoute,
  );
  const setScenarioStartPointIndex = useScenarioStore(
    (state) => state.setScenarioStartPointIndex,
  );
  const setScenarioEndPointIndex = useScenarioStore(
    (state) => state.setScenarioEndPointIndex,
  );
  const airspaces = useAeronauticalDataStore((state) => state.airspaces);
  const airports = useAeronauticalDataStore((state) => state.airports);

  useEffect(() => {
    async function fetchAirspaces() {
      // Lazy load airspaces/airports into stores - can trpc not do this typesafe?
      const freshAirspaces: Airspace[] = (
        await fetch("/api/aeronautical-data/airspaces").then((res) =>
          res.json(),
        )
      ).data as Airspace[];

      if (freshAirspaces.length < 100) {
        throw new Error(
          "Some airspaces could not be loaded. This may be due to an OpenAIP outage. Please contact support if this persists.",
        );
      }

      useAeronauticalDataStore.setState({ airspaces: freshAirspaces });
    }

    async function fetchAirports() {
      const freshAirports: Airport[] = (
        await fetch("/api/aeronautical-data/airports").then((res) => res.json())
      ).data as Airport[];

      if (freshAirports.length < 50) {
        throw new Error(
          "Some airports could not be loaded. This may be due to an OpenAIP outage. Please contact support if this persists.",
        );
      }

      useAeronauticalDataStore.setState({ airports: freshAirports });
    }

    if (airports.length < 50) {
      void fetchAirports();
    }

    if (airspaces.length < 100) {
      void fetchAirspaces();
    }
  }, [airports.length, airspaces.length]);

  useEffect(() => {
    // Generate scenario if not already in store and up-to-date
    // Check that all required data is available
    if (
      scenarioPoints.length == 0 &&
      seed &&
      callsign &&
      waypoints &&
      airports.length > 0 &&
      airspaces.length > 0 &&
      hasEmergencyEvents != undefined
    ) {
      const generatedScenarioPoints = generateScenario(
        seed,
        callsign,
        waypoints,
        airports,
        airspaces,
        hasEmergencyEvents,
        prefix,
      );

      console.log("Generated scenario points", generatedScenarioPoints);

      setScenarioPoints(generatedScenarioPoints);
    }
  }, [
    scenarioPoints,
    seed,
    callsign,
    prefix,
    waypoints,
    airports,
    airspaces,
    hasEmergencyEvents,
    setScenarioPoints,
  ]);

  useEffect(() => {
    if (scenarioPoints.length <= 0) {
      return;
    }

    if (scenarioId) {
      setScenarioId(scenarioId);
    }

    setWaypoints(waypoints ?? []);

    // Fetch airspaces and airports based on ids
    const onRouteAirspaces = airspaces.filter((airspace) =>
      airspaceIds?.includes(airspace._id),
    );
    const onRouteAirports = airports.filter((airport) =>
      airportIds?.includes(airport._id),
    );

    setOnRouteAirspaces(onRouteAirspaces);
    setOnRouteAirports(onRouteAirports);

    if (startIndex) {
      setScenarioStartPointIndex(startIndex);
    }

    if (endIndex) {
      if (endIndex >= scenarioPoints.length) {
        setScenarioEndPointIndex(scenarioPoints.length - 1);
      } else {
        setScenarioEndPointIndex(endIndex);
      }
    }
    // Check if end point makes sense
  }, [
    waypoints,
    setWaypoints,
    airspaceIds,
    airportIds,
    airspaces,
    airports,
    setOnRouteAirspaces,
    setOnRouteAirports,
    scenarioId,
    setScenarioId,
    startIndex,
    setScenarioStartPointIndex,
    scenarioPoints.length,
    endIndex,
    setScenarioEndPointIndex,
  ]);

  return <Simulator />;
};

export default SimPageComponent;
