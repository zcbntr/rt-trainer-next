/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { type SimPageProps } from "./index";

const SimPageWrapper = ({
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
  const DynamicSimPageComponent = dynamic(() => import("./index"), {
    ssr: false,
  });

  return (
    <DynamicSimPageComponent
      scenarioId={scenarioId}
      seed={seed}
      callsign={callsign}
      prefix={prefix}
      waypoints={waypoints}
      airportIds={airportIds}
      airspaceIds={airspaceIds}
      startIndex={startIndex}
      endIndex={endIndex}
      hasEmergencyEvents={hasEmergencyEvents}
    />
  );
};

export default SimPageWrapper;
