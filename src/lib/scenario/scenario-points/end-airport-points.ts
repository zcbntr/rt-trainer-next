import {
  getLandingRunwayFromSeed,
  getParkedFrequency,
  getPointAlongRunwayVector,
  getTowerFrequency,
  isAirportControlled,
} from "~/lib/sim-utils/airport-fns";
import { calculateDistanceAlongRoute } from "~/lib/sim-utils/route";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";
import {
  EmergencyType,
  type AircraftPose,
  type ScenarioPoint,
} from "~/lib/types/scenario";
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
  const endAirportShortName = endAirport.name.split(" ")[0];

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
    const towerFrequency = getTowerFrequency(endAirport)!;

    const requestJoin: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.RequestJoin,
      pose: requestJoinPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 10,
      distanceAlongRoute: requestJoinDistanceAlongRoute,
      currentContext: `You are currently approaching ${endAirportShortName}, you should contact ${towerFrequency.name} on ${towerFrequency.value}`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(requestJoin);

    const reportDetails: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ReportDetails,
      pose: requestJoinPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 10,
      distanceAlongRoute: requestJoinDistanceAlongRoute,
      currentContext: `You are currently in contact with ${endAirportShortName} on ${towerFrequency.value}, you should report your current position`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportDetails);

    const readbackOverheadJoinClearance: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ReadbackOverheadJoinClearance,
      pose: requestJoinPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 9,
      distanceAlongRoute: requestJoinDistanceAlongRoute,
      currentContext: `You are currently being cleared to join circuits at ${endAirportShortName}, you should read back your join clearence to ${towerFrequency.name} on ${towerFrequency.value}`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackOverheadJoinClearance);

    const reportAirodromeInSight: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ReportAirportInSight,
      pose: followTrafficPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 9,
      distanceAlongRoute: followTrafficDistanceAlongRoute,
      currentContext: `You have spotted the airodrome (${endAirportShortName}), you should report this to ${towerFrequency.name} on ${towerFrequency.value}`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportAirodromeInSight);

    const contactTower: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ContactTower,
      pose: followTrafficPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 8,
      distanceAlongRoute: followTrafficDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(contactTower);

    const reportStatus: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportStatus,
      pose: followTrafficPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 8,
      distanceAlongRoute: followTrafficDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportStatus);

    const readbackLandingInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReadbackLandingInformation,
      pose: followTrafficPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 7,
      distanceAlongRoute: followTrafficDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackLandingInformation);

    const reportDescending: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportDescending,
      pose: followTrafficPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 7,
      distanceAlongRoute: followTrafficDistance,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportDescending);

    const wilcoReportDownwind: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.WilcoReportDownwind,
      pose: followTrafficPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 6,
      distanceAlongRoute: followTrafficDistance,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(wilcoReportDownwind);

    const reportDownwind: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportDownwind,
      pose: followTrafficPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 6,
      distanceAlongRoute: followTrafficDistance,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportDownwind);

    const wilcoFollowTraffic: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.WilcoFollowTraffic,
      pose: followTrafficPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 5,
      distanceAlongRoute: followTrafficDistance,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(wilcoFollowTraffic);

    const reportFinal: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportFinal,
      pose: reportFinalPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 4,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportFinal);

    const readbackContinueApproach: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReadbackContinueApproach,
      pose: reportFinalPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 3,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackContinueApproach);

    const readbackLandingClearance: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReadbackLandingClearance,
      pose: reportFinalPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 3,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackLandingClearance);

    const readbackVacateRunwayRequest: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReadbackVacateRunwayRequest,
      pose: onRunwayPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 2,
      distanceAlongRoute: onRunwayDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackVacateRunwayRequest);

    const reportVacatedRunway: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReportVacatedRunway,
      pose: runwayVacatedPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime + 5,
      distanceAlongRoute: runwayVacatedDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportVacatedRunway);

    const readbackTaxiInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReadbackTaxiInformation,
      pose: parkedPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime + 5,
      distanceAlongRoute: runwayVacatedDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: towerFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackTaxiInformation);
  } else {
    const groundFrequency = getParkedFrequency(endAirport)!;

    const requestJoin: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.RequestJoin,
      pose: reportFinalPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 10,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: groundFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(requestJoin);

    const reportDetails: ScenarioPoint = {
      index: pointIndex++,
      stage: InboundForJoinStage.ReportDetails,
      pose: reportFinalPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 10,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: groundFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportDetails);

    const reportCrosswindJoin: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportCrosswindJoin,
      pose: reportFinalPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 9,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: groundFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportCrosswindJoin);

    const reportDownwind: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportDownwind,
      pose: reportFinalPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 6,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: groundFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportDownwind);

    const reportFinal: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReportFinal,
      pose: reportFinalPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 4,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: groundFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportFinal);

    const readbackContinueApproach: ScenarioPoint = {
      index: pointIndex++,
      stage: CircuitAndLandingStage.ReadbackContinueApproach,
      pose: reportFinalPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime - 3,
      distanceAlongRoute: reportFinalDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: groundFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackContinueApproach);

    const reportVacatedRunway: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReportVacatedRunway,
      pose: runwayVacatedPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime + 5,
      distanceAlongRoute: runwayVacatedDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: groundFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportVacatedRunway);

    const reportTaxiing: ScenarioPoint = {
      index: pointIndex++,
      stage: LandingToParkedStage.ReportTaxiing,
      pose: parkedPose,
      nextWaypointIndex: waypoints.length - 1,
      timeAtPoint: landingTime + 5,
      distanceAlongRoute: runwayVacatedDistanceAlongRoute,
      currentContext: `Not Implemented`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: groundFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportTaxiing);
  }

  return stages;
}
