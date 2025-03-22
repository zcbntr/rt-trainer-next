"use client";

import { type Waypoint } from "~/lib/types/waypoint";
import React, { useEffect } from "react";
import useAeronauticalDataStore from "~/app/stores/aeronautical-data-store";
import Simulator from "./simulator";
import useScenarioStore from "~/app/stores/scenario-store";
import { generateScenario } from "~/lib/scenario/scenario-generator";

type SimPageProps = {
  scenarioId?: number;
  seed?: string;
  callsign: string;
  prefix: string;
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

  //   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //   THIS IS NOT GETTING ALL THE REQUIRED DATA TO GENERATE A SCENARIO
  //   !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  //   Generate scenario if not already in store and up-to-date
  if (
    scenarioPoints.length == 0 &&
    seed &&
    waypoints &&
    airports &&
    airspaces &&
    hasEmergencyEvents != undefined
  ) {
    const generatedScenarioPoints = generateScenario(
      seed,
      callsign,
      prefix,
      waypoints,
      airports,
      airspaces,
      hasEmergencyEvents,
    );

    console.log("Generated scenario points", generatedScenarioPoints);

    setScenarioPoints(generatedScenarioPoints);
  }

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
