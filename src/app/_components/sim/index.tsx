"use client";

import { type Waypoint } from "~/lib/types/waypoint";
import React from "react";
import useAeronauticalDataStore from "~/app/stores/aeronautical-data-store";
import Simulator from "./simulator";
import useScenarioStore from "~/app/stores/scenario-store";
import { generateScenario } from "~/lib/scenario/scenario-generator";

type SimPageProps = {
  scenarioId?: number;
  seed?: string;
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
  waypoints,
  airspaceIds,
  airportIds,
  startIndex,
  endIndex,
  hasEmergencyEvents,
}: SimPageProps) => {
  // Push waypoints to store, look up airpsace and airport ids and add them to store
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

  //   Generate scenario if not already in store and up-to-date
  React.useEffect(() => {
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
        waypoints,
        airports,
        airspaces,
        hasEmergencyEvents,
      );

      setScenarioPoints(generatedScenarioPoints);
    }
  });

  React.useEffect(() => {
    if (scenarioPoints.length <= 0) {
      return;
    }

    if (scenarioId != -1 && scenarioId != undefined) {
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
