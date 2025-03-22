import {
  getLandingRunwayFromSeed,
  getPointAlongRunwayVector,
  isAirportControlled,
} from "~/lib/sim-utils/airport-fns";
import { calculateDistanceAlongRoute } from "~/lib/sim-utils/route";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";
import { type AircraftPose, type ScenarioPoint } from "~/lib/types/scenario";
import { type Waypoint } from "~/lib/types/waypoint";
import { seedStringToNumber } from "~/lib/utils";
import {
  InboundForJoinStage,
  CircuitAndLandingStage,
  LandingToParkedStage,
} from "../stages";
import { distance } from "@turf/turf";
import { AIRCRAFT_AVERAGE_SPEED, FLIGHT_TIME_MULTIPLIER } from "..";

export function getEndAirportScenarioPoints(
  pointIndex: number,
  seedString: string,
  waypoints: Waypoint[],
  _airspaces: Airspace[],
  endAirport: Airport,
  previousScenarioPoint: ScenarioPoint,
): ScenarioPoint[] {
  const seed = seedStringToNumber(seedString);
  const stages: ScenarioPoint[] = [];
  const previousPointTime = previousScenarioPoint.timeAtPoint;
  const distanceToLandingAirportFromPrevPoint = distance(
    previousScenarioPoint.pose.position,
    endAirport.geometry.coordinates,
    { units: "kilometers" },
  );

  const waypointCoords = waypoints.map((waypoint) => waypoint.location);

  const landingTime =
    previousPointTime +
    10 +
    Math.round(
      (distanceToLandingAirportFromPrevPoint / AIRCRAFT_AVERAGE_SPEED) *
        FLIGHT_TIME_MULTIPLIER,
    );
  const landingRunway = getLandingRunwayFromSeed(endAirport.runways, seed);

  const parkedPose: AircraftPose = {
    position: endAirport.geometry.coordinates,
    trueHeading: 0,
    altitude: 0,
    airSpeed: 0.0,
  };

  /* Safety Sense: "When arriving at an ATC aerodrome you should call 15 NM or 5 minutes
     flying time from the ATZ boundary (whichever is greater)"*/
  const requestJoinDistance = -16.0 + (seed % 20) * 0.1;
  const requestJoinLocation = getPointAlongRunwayVector(
    landingRunway,
    requestJoinDistance,
  );
  const requestJoinPose: AircraftPose = {
    position: requestJoinLocation,
    trueHeading: landingRunway.trueHeading,
    altitude: 1200,
    airSpeed: 84.0,
  };
  const requestJoinDistanceAlongRoute = calculateDistanceAlongRoute(
    waypointCoords,
    requestJoinLocation,
  );

  const followTrafficDistance = -7.0 + (seed % 20) * 0.1;
  const followTrafficLocation = getPointAlongRunwayVector(
    landingRunway,
    -followTrafficDistance,
  );
  const followTrafficPose: AircraftPose = {
    position: followTrafficLocation,
    trueHeading: landingRunway.trueHeading,
    altitude: 1200,
    airSpeed: 84.0,
  };
  const followTrafficDistanceAlongRoute = calculateDistanceAlongRoute(
    waypointCoords,
    followTrafficLocation,
  );

  const reportFinalDistance = -4.0 + (seed % 20) * 0.1;
  const reportFinalLocation = getPointAlongRunwayVector(
    landingRunway,
    reportFinalDistance,
  );
  const reportFinalPose: AircraftPose = {
    position: reportFinalLocation,
    trueHeading: landingRunway.trueHeading,
    altitude: 750,
    airSpeed: 55.0,
  };
  const reportFinalDistanceAlongRoute = calculateDistanceAlongRoute(
    waypointCoords,
    reportFinalLocation,
  );

  const onRunwayPose: AircraftPose = {
    position: getPointAlongRunwayVector(landingRunway, -0.05),
    trueHeading: landingRunway.trueHeading,
    altitude: 0.0,
    airSpeed: 0.0,
  };
  const onRunwayDistanceAlongRoute = calculateDistanceAlongRoute(
    waypointCoords,
    onRunwayPose.position,
  );

  const runwayVacatedPose: AircraftPose = {
    position: endAirport.geometry.coordinates,
    trueHeading: 0,
    altitude: 0.0,
    airSpeed: 0.0,
  };
  const runwayVacatedDistanceAlongRoute = calculateDistanceAlongRoute(
    waypointCoords,
    runwayVacatedPose.position,
  );

  if (isAirportControlled(endAirport)) {
    const requestJoin: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.RequestJoin,
      pose: requestJoinPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 10,
      distanceAlongRoute: requestJoinDistanceAlongRoute,
    };
    stages.push(requestJoin);

    const reportDetails: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ReportDetails,
      pose: requestJoinPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 10,
      distanceAlongRoute: requestJoinDistanceAlongRoute,
    };
    stages.push(reportDetails);

    const readbackOverheadJoinClearance: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ReadbackOverheadJoinClearance,
      pose: requestJoinPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 9,
      distanceAlongRoute: requestJoinDistanceAlongRoute,
    };
    stages.push(readbackOverheadJoinClearance);

    const reportAirodromeInSight: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ReportAirportInSight,
      pose: followTrafficPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 9,
      distanceAlongRoute: followTrafficDistanceAlongRoute,
    };
    stages.push(reportAirodromeInSight);

    const contactTower: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ContactTower,
      pose: followTrafficPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 8,
      distanceAlongRoute: followTrafficDistanceAlongRoute,
    };
    stages.push(contactTower);

    const reportStatus: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportStatus,
      pose: followTrafficPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 8,
      distanceAlongRoute: followTrafficDistanceAlongRoute,
    };
    stages.push(reportStatus);

    const readbackLandingInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReadbackLandingInformation,
      pose: followTrafficPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 7,
      distanceAlongRoute: followTrafficDistanceAlongRoute,
    };
    stages.push(readbackLandingInformation);

    const reportDescending: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportDescending,
      pose: followTrafficPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 7,
      distanceAlongRoute: followTrafficDistance,
    };
    stages.push(reportDescending);

    const wilcoReportDownwind: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.WilcoReportDownwind,
      pose: followTrafficPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 6,
      distanceAlongRoute: followTrafficDistance,
    };
    stages.push(wilcoReportDownwind);

    const reportDownwind: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportDownwind,
      pose: followTrafficPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 6,
      distanceAlongRoute: followTrafficDistance,
    };
    stages.push(reportDownwind);

    const wilcoFollowTraffic: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.WilcoFollowTraffic,
      pose: followTrafficPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 5,
      distanceAlongRoute: followTrafficDistance,
    };
    stages.push(wilcoFollowTraffic);

    const reportFinal: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportFinal,
      pose: reportFinalPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 4,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
    };
    stages.push(reportFinal);

    const readbackContinueApproach: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReadbackContinueApproach,
      pose: reportFinalPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 3,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
    };
    stages.push(readbackContinueApproach);

    const readbackLandingClearance: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReadbackLandingClearance,
      pose: reportFinalPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 3,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
    };
    stages.push(readbackLandingClearance);

    const readbackVacateRunwayRequest: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReadbackVacateRunwayRequest,
      pose: onRunwayPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 2,
      distanceAlongRoute: onRunwayDistanceAlongRoute,
    };
    stages.push(readbackVacateRunwayRequest);

    const reportVacatedRunway: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReportVacatedRunway,
      pose: runwayVacatedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime + 5,
      distanceAlongRoute: runwayVacatedDistanceAlongRoute,
    };
    stages.push(reportVacatedRunway);

    const readbackTaxiInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReadbackTaxiInformation,
      pose: parkedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime + 5,
      distanceAlongRoute: runwayVacatedDistanceAlongRoute,
    };
    stages.push(readbackTaxiInformation);
  } else {
    const requestJoin: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.RequestJoin,
      pose: reportFinalPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 10,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
    };
    stages.push(requestJoin);

    const reportDetails: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ReportDetails,
      pose: reportFinalPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 10,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
    };
    stages.push(reportDetails);

    const reportCrosswindJoin: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportCrosswindJoin,
      pose: reportFinalPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 9,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
    };
    stages.push(reportCrosswindJoin);

    const reportDownwind: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportDownwind,
      pose: reportFinalPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 6,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
    };
    stages.push(reportDownwind);

    const reportFinal: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportFinal,
      pose: reportFinalPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 4,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
    };
    stages.push(reportFinal);

    const readbackContinueApproach: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReadbackContinueApproach,
      pose: reportFinalPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 3,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
    };
    stages.push(readbackContinueApproach);

    const reportVacatedRunway: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReportVacatedRunway,
      pose: runwayVacatedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime + 5,
      distanceAlongRoute: runwayVacatedDistanceAlongRoute,
    };
    stages.push(reportVacatedRunway);

    const reportTaxiing: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReportTaxiing,
      pose: parkedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, endAirport),
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime + 5,
      distanceAlongRoute: runwayVacatedDistanceAlongRoute,
    };
    stages.push(reportTaxiing);
  }

  return stages;
}
