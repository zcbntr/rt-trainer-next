import { type Position } from "geojson";
import { type Airport } from "../types/airport";
import {
  EmergencyType,
  type AircraftPose,
  type ScenarioPoint,
} from "../types/scenario";
import { type SimulatorUpdateData } from "../types/simulator";
import {
  calculateDistanceAlongRoute,
  findIntersections,
  type Intersection,
} from "../sim-utils/route";
import { type Waypoint } from "../types/waypoint";
import { type Airspace } from "../types/airspace";
import { seedStringToNumber } from "../utils";
import {
  getRandomFrequencyFromSeed,
  getRandomSqwuakCodeFromSeed,
  getSeededTimeInMinutes,
  lerp,
} from "../sim-utils";
import { getShortAirportName } from "../sim-utils/callsigns";
import {
  getLandingRunwayFromSeed,
  getParkedFrequency,
  getPointAlongRunwayVector,
  getScenarioStartTime,
  getTakeoffRunwayFromSeed,
  isAirportControlled,
} from "../sim-utils/airport-fns";
import * as turf from "@turf/turf";
import {
  ChangeZoneStage,
  CircuitAndLandingStage,
  ClimbOutStage,
  InboundForJoinStage,
  LandingToParkedStage,
  PanPanStage,
  StartUpStage,
  TakeOffStage,
  TaxiStage,
} from "./stages";

export const AIRCRAFT_AVERAGE_SPEED = 3.75; // km per minute. 225 km/h, 120 knots, 140 mph (Cessna 172 max cruise speed)
export const FLIGHT_TIME_MULTIPLIER = 1.3; // Multiplier to account for climb, descent and other factors. Very rough estimate

export function getParkedInitialControlledUpdateData(
  _seed: number,
  airport: Airport,
): SimulatorUpdateData {
  const parkedFreq = getParkedFrequency(airport);
  if (!parkedFreq) {
    throw new Error("No parked frequency found for airport");
  }

  let freqName = parkedFreq.name;
  const freqValue = parkedFreq.value;

  // Edge case for INFO frequencies
  if (freqName == "INFO") {
    freqName = getShortAirportName(airport) + " Information";
  }
  return {
    currentContext: `You are currently parked at ${getShortAirportName(airport)}, you should contact ${freqName} on ${freqValue}`,
    callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
    squark: false,
    currentTarget: freqName,
    currentTargetFrequency: freqValue,
    currentTransponderFrequency: "7000",
    currentPressure: 1013,
    emergency: EmergencyType.None,
  };
}

export function getParkedMadeContactControlledUpdateData(
  _seed: number,
  airport: Airport,
): SimulatorUpdateData {
  const parkedFreq = getParkedFrequency(airport);
  if (!parkedFreq) {
    throw new Error("No parked frequency found for airport");
  }

  let freqName = parkedFreq.name;
  const freqValue = parkedFreq.value;

  // Edge case for INFO frequencies
  if (freqName == "INFO") {
    freqName = getShortAirportName(airport) + " Information";
  }
  return {
    currentContext: `You are currently parked at 
			${getShortAirportName(airport)}
			you have made contact with
			${freqName} on ${freqValue}, you should request taxi clearance.`,
    callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
    squark: false,
    currentTarget: freqName,
    currentTargetFrequency: freqValue,
    currentTransponderFrequency: "7000",
    currentPressure: 1013,
    emergency: EmergencyType.None,
  };
}

export function getParkedInitialUncontrolledUpdateData(
  _seed: number,
  airport: Airport,
): SimulatorUpdateData {
  const parkedFreq = getParkedFrequency(airport);
  if (!parkedFreq) {
    throw new Error("No parked frequency found for airport");
  }

  let freqName = parkedFreq.name;
  const freqValue = parkedFreq.value;

  // Edge case for INFO frequencies
  if (freqName == "INFO") {
    freqName = getShortAirportName(airport) + " Information";
  }
  return {
    currentContext: `You are currently parked at ${getShortAirportName(airport)}, you should contact ${freqName} on ${freqValue}`,
    callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
    squark: false,
    currentTarget: freqName,
    currentTargetFrequency: freqValue,
    currentTransponderFrequency: "7000",
    currentPressure: 1013,
    emergency: EmergencyType.None,
  };
}

export function getParkedMadeContactUncontrolledUpdateData(
  seed: number,
  airport: Airport,
): SimulatorUpdateData {
  const parkedFreq = getParkedFrequency(airport);
  if (!parkedFreq) {
    throw new Error("No parked frequency found for airport");
  }

  let freqName = parkedFreq.name;
  const freqValue = parkedFreq.value;

  // Edge case for INFO frequencies
  if (freqName == "INFO") {
    freqName = getShortAirportName(airport) + " Information";
  }
  return {
    currentContext: `You are currently parked at 
			${getShortAirportName(airport)}
			you have made contact with
			${freqName} on ${freqValue}, you should request taxi clearance.`,
    callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
    squark: false,
    currentTarget: freqName,
    currentTargetFrequency: freqValue,
    currentTransponderFrequency: "7000",
    currentPressure: 1013,
    emergency: EmergencyType.None,
  };
}

/* Get the start aerodrome states. This includes all stages of:     
	Start up,
    Taxiing,
    TakeOff,
	Climb Out of the start aerodrome's airspace.
	 */
export function getStartAirportScenarioPoints(
  seedString: string,
  waypoints: Waypoint[],
  airspaces: Airspace[],
  startAirport: Airport,
): ScenarioPoint[] {
  let pointIndex = 0;
  const seed = seedStringToNumber(seedString);
  const stages: ScenarioPoint[] = [];
  const startAerodromeTime: number = getScenarioStartTime(seed);
  const takeoffRunway = getTakeoffRunwayFromSeed(startAirport.runways, seed);
  const initialRouteHeading = Math.round(
    turf.bearing(waypoints[0]!.location, waypoints[1]!.location),
  );

  const waypointCoords = waypoints.map((waypoint) => waypoint.location);

  const groundedPose: AircraftPose = {
    position: startAirport.geometry.coordinates,
    trueHeading: 0,
    altitude: 0,
    airSpeed: 0.0,
  };

  const takingOffPosition = getPointAlongRunwayVector(takeoffRunway, 0);
  const takingOffPose: AircraftPose = {
    position: takingOffPosition,
    trueHeading: takeoffRunway.trueHeading,
    altitude: 0,
    airSpeed: 0.0,
  };

  const climbingOutPosition: Position = getPointAlongRunwayVector(
    takeoffRunway,
    1.0,
  );
  const climbingOutPose: AircraftPose = {
    position: climbingOutPosition,
    trueHeading: takeoffRunway.trueHeading,
    altitude: 1200,
    airSpeed: 70.0,
  };

  const takeoffAirspace = airspaces.find((x) =>
    x.name.includes(startAirport.name),
  );

  if (isAirportControlled(startAirport) && takeoffAirspace) {
    const firstRouteSegment = [waypoints[0]!.location, waypoints[1]!.location];
    const leavingZonePosition: Position = findIntersections(firstRouteSegment, [
      takeoffAirspace,
    ])[0]!.position;
    const leavingZonePose: AircraftPose = {
      position: leavingZonePosition,
      trueHeading: initialRouteHeading,
      altitude: 1200,
      airSpeed: 70.0,
    };
    const radioCheck: ScenarioPoint = {
      index: pointIndex++,
      stage: StartUpStage.RadioCheck,
      pose: groundedPose,
      updateData: getParkedInitialControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime,
      distanceAlongRoute: 0,
    };
    stages.push(radioCheck);

    const requestDepartInfo: ScenarioPoint = {
      index: pointIndex++,
      stage: StartUpStage.DepartureInformationRequest,
      pose: groundedPose,
      updateData: getParkedInitialControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime,
      distanceAlongRoute: 0,
    };
    stages.push(requestDepartInfo);

    const readbackDepartInfo: ScenarioPoint = {
      index: pointIndex++,
      stage: StartUpStage.ReadbackDepartureInformation,
      pose: groundedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 1,
      distanceAlongRoute: 0,
    };
    stages.push(readbackDepartInfo);

    const taxiRequest: ScenarioPoint = {
      index: pointIndex++,
      stage: TaxiStage.TaxiRequest,
      pose: groundedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 1,
      distanceAlongRoute: 0,
    };
    stages.push(taxiRequest);

    const taxiClearanceReadback: ScenarioPoint = {
      index: pointIndex++,
      stage: TaxiStage.TaxiClearanceReadback,
      pose: groundedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 5,
      distanceAlongRoute: 0,
    };
    stages.push(taxiClearanceReadback);

    const ReadyForDeparture: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.ReadyForDeparture,
      pose: groundedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 8,
      distanceAlongRoute: 0,
    };
    stages.push(ReadyForDeparture);

    const readbackAfterDepartureInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.ReadbackAfterDepartureInformation,
      pose: groundedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 9,
      distanceAlongRoute: 0,
    };
    stages.push(readbackAfterDepartureInformation);

    const readbackClearance: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.ReadbackClearance,
      pose: groundedPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 9,
      distanceAlongRoute: 0,
    };
    stages.push(readbackClearance);

    const readbackNextContact: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.ReadbackNextContact,
      pose: climbingOutPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 12,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        climbingOutPose.position,
      ),
    };
    stages.push(readbackNextContact);

    const contactNextFrequency: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.ContactNextFrequency,
      pose: climbingOutPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 15,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        climbingOutPose.position,
      ),
    };
    stages.push(contactNextFrequency);

    const acknowledgeNewFrequencyRequest: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.AcknowledgeNewFrequencyRequest,
      pose: climbingOutPose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 15,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        climbingOutPose.position,
      ),
    };
    stages.push(acknowledgeNewFrequencyRequest);

    const reportLeavingZone: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.ReportLeavingZone,
      pose: leavingZonePose,
      updateData: getParkedMadeContactControlledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 18,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        leavingZonePose.position,
      ),
    };
    stages.push(reportLeavingZone);
  } else {
    const firstRouteSegment = [waypoints[0]!.location, waypoints[1]!.location];
    let leavingZonePosition: Position = [0, 0];
    if (takeoffAirspace)
      leavingZonePosition = findIntersections(firstRouteSegment, [
        takeoffAirspace,
      ])[0]!.position;
    else
      leavingZonePosition = turf.destination(
        waypoints[0]!.location,
        4,
        initialRouteHeading,
        { units: "kilometers" },
      ).geometry.coordinates;

    const leavingZonePose: AircraftPose = {
      position: leavingZonePosition,
      trueHeading: initialRouteHeading,
      altitude: 1200,
      airSpeed: 70.0,
    };

    const radioCheck: ScenarioPoint = {
      index: pointIndex++,
      stage: StartUpStage.RadioCheck,
      pose: groundedPose,
      updateData: getParkedInitialUncontrolledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime,
      distanceAlongRoute: 0,
    };
    stages.push(radioCheck);

    const requestTaxiInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: TaxiStage.RequestTaxiInformation,
      pose: groundedPose,
      updateData: getParkedInitialUncontrolledUpdateData(seed, startAirport),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 1,
      distanceAlongRoute: 0,
    };
    stages.push(requestTaxiInformation);

    const readbackTaxiInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: TaxiStage.AnnounceTaxiing,
      pose: groundedPose,
      updateData: getParkedMadeContactUncontrolledUpdateData(
        seed,
        startAirport,
      ),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 1,
      distanceAlongRoute: 0,
    };
    stages.push(readbackTaxiInformation);

    const readyForDeparture: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.ReadyForDeparture,
      pose: groundedPose,
      updateData: getParkedMadeContactUncontrolledUpdateData(
        seed,
        startAirport,
      ),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 8,
      distanceAlongRoute: 0,
    };
    stages.push(readyForDeparture);

    const acknowledgeTraffic: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.AcknowledgeTraffic,
      pose: groundedPose,
      updateData: getParkedMadeContactUncontrolledUpdateData(
        seed,
        startAirport,
      ),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 9,
      distanceAlongRoute: 0,
    };
    stages.push(acknowledgeTraffic);

    const reportTakingOff: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.AnnounceTakingOff,
      pose: takingOffPose,
      updateData: getParkedMadeContactUncontrolledUpdateData(
        seed,
        startAirport,
      ),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 10,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        takingOffPose.position,
      ),
    };
    stages.push(reportTakingOff);

    const reportLeavingZone: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.AnnounceLeavingZone,
      pose: leavingZonePose,
      updateData: getParkedMadeContactUncontrolledUpdateData(
        seed,
        startAirport,
      ),
      nextWaypointIndex: 0,
      timeAtPoint: startAerodromeTime + 15,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        leavingZonePose.position,
      ),
    };
    stages.push(reportLeavingZone);
  }

  return stages;
}

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
  const distanceToLandingAirportFromPrevPoint = turf.distance(
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

export function getAirborneScenarioPoints(
  pointIndex: number,
  seedString: string,
  waypoints: Waypoint[],
  airspaces: Airspace[],
  airspaceIntersectionPoints: Intersection[],
  startAirport: Airport | undefined,
  endAirport: Airport | undefined,
  previousScenarioPoint: ScenarioPoint,
  hasEmergency: boolean,
): ScenarioPoint[] {
  const seed = seedStringToNumber(seedString);

  // Add events at each point
  const scenarioPoints: ScenarioPoint[] = [];
  const endStageIndexes: number[] = [];
  let timeAtPreviousPoint: number;
  let previousPosition: Position = [0, 0];
  if (previousScenarioPoint) {
    timeAtPreviousPoint = previousScenarioPoint.timeAtPoint;
    previousPosition = previousScenarioPoint.pose.position;
  } else {
    timeAtPreviousPoint = getSeededTimeInMinutes(seed, 780, 840);
    previousPosition = waypoints[0]!.location;
  }

  const waypointCoords = waypoints.map((waypoint) => waypoint.location);
  const waypointDistancesAlongRoute = waypoints.map((waypoint, index) => {
    if (index == 0) return 0;
    return calculateDistanceAlongRoute(waypointCoords, waypoint.location);
  });

  let startIntersection = 0;
  if (
    previousScenarioPoint &&
    previousScenarioPoint.stage == "Announce Leaving Zone"
  )
    startIntersection = 1;

  for (let i = startIntersection; i < airspaceIntersectionPoints.length; i++) {
    const distanceFromPrevPoint: number = turf.distance(
      previousPosition,
      airspaceIntersectionPoints[i]!.position,
      { units: "kilometers" },
    );
    let distanceToNextPoint: number = -1;
    if (i < airspaceIntersectionPoints.length - 1) {
      distanceToNextPoint = turf.distance(
        airspaceIntersectionPoints[i]!.position,
        airspaceIntersectionPoints[i + 1]!.position,
        { units: "kilometers" },
      );
    }

    // distance in m, speed in m/min, time in min
    const timeAtCurrentPoint =
      timeAtPreviousPoint +
      Math.round(
        (distanceFromPrevPoint / AIRCRAFT_AVERAGE_SPEED) *
          FLIGHT_TIME_MULTIPLIER,
      );

    const heading = Math.round(
      turf.bearingToAzimuth(
        turf.bearing(previousPosition, airspaceIntersectionPoints[i]!.position),
      ),
    );

    const preIntersectionPose: AircraftPose = {
      position: turf.destination(
        airspaceIntersectionPoints[i]!.position,
        -0.5,
        heading,
        { units: "kilometers" },
      ).geometry.coordinates,
      trueHeading: heading,
      altitude: 2000,
      airSpeed: 130,
    };
    const preIntersectionPoseDistanceAlongRoute = calculateDistanceAlongRoute(
      waypointCoords,
      preIntersectionPose.position,
    );

    const intersectionPose: AircraftPose = {
      position: airspaceIntersectionPoints[i]!.position,
      trueHeading: heading,
      altitude: 2000,
      airSpeed: 130,
    };
    const intersectionPoseDistanceAlongRoute = calculateDistanceAlongRoute(
      waypointCoords,
      intersectionPose.position,
    );

    const currentAirspace = airspaces.find(
      (x) => x._id == airspaceIntersectionPoints[i]?.airspaceId,
    )!;

    const nextAirspace = airspaces.find(
      (x) => x._id == airspaceIntersectionPoints[i + 1]?.airspaceId,
    )!;

    // If the distance to the next airspace is less than 10m
    // then we are switching immediately from one to another
    // Otherwise it is just entering the airspace
    const switchingAirspace =
      distanceToNextPoint < 0.01 && distanceToNextPoint > 0;

    if (switchingAirspace && currentAirspace.name == nextAirspace.name) {
      continue;
    }

    // Add logic to determine what stages to add at each point
    if (!airspaceIntersectionPoints[i]!.enteringAirspace || switchingAirspace) {
      const currentFreq = getRandomFrequencyFromSeed(seed, currentAirspace._id);

      const requestFrequencyChange: ScenarioPoint = {
        index: pointIndex++,
        stage: ChangeZoneStage.RequestFrequencyChange,
        pose: preIntersectionPose,
        updateData: {
          currentContext: `You are currently flying in ${currentAirspace.name}, you should request a frequency change to ${currentFreq}`,
          callsignModified: false,
          squark: false,
          currentTarget: currentAirspace.name,
          currentTargetFrequency: currentFreq,
          currentTransponderFrequency: "7000",
          currentPressure: 1013,
          emergency: EmergencyType.None,
        },
        nextWaypointIndex: i + 1,
        timeAtPoint: timeAtCurrentPoint,
        distanceAlongRoute: preIntersectionPoseDistanceAlongRoute,
      };
      scenarioPoints.push(requestFrequencyChange);

      const acknowledgeApproval: ScenarioPoint = {
        index: pointIndex++,
        stage: ChangeZoneStage.AcknowledgeApproval,
        pose: preIntersectionPose,
        updateData: {
          currentContext: `You are currently flying in ${currentAirspace.name}, you have been approved to change frequency to ${currentFreq}, you should acknowledge this.`,
          callsignModified: false,
          squark: false,
          currentTarget: currentAirspace.name,
          currentTargetFrequency: currentFreq,
          currentTransponderFrequency: "7000",
          currentPressure: 1013,
          emergency: EmergencyType.None,
        },
        nextWaypointIndex: i + 1,
        timeAtPoint: timeAtCurrentPoint + 1,
        distanceAlongRoute: preIntersectionPoseDistanceAlongRoute,
      };
      scenarioPoints.push(acknowledgeApproval);
    }

    if (airspaceIntersectionPoints[i]!.enteringAirspace || switchingAirspace) {
      let newFreq = getRandomFrequencyFromSeed(seed, currentAirspace._id);
      let squarkCode = getRandomSqwuakCodeFromSeed(seed, currentAirspace._id);
      if (switchingAirspace) {
        newFreq = getRandomFrequencyFromSeed(seed, nextAirspace._id);
        squarkCode = getRandomSqwuakCodeFromSeed(seed, nextAirspace._id);
      }

      const contactNewFrequency: ScenarioPoint = {
        index: pointIndex++,
        stage: ChangeZoneStage.ContactNewFrequency,
        pose: preIntersectionPose,
        updateData: {
          currentContext: `You are currently flying in ${currentAirspace.name}, you should contact the new frequency ${newFreq}`,
          callsignModified: false,
          squark: false,
          currentTarget: currentAirspace.name,
          currentTargetFrequency: newFreq,
          currentTransponderFrequency: "7000",
          currentPressure: 1013,
          emergency: EmergencyType.None,
        },
        nextWaypointIndex: i + 1,
        timeAtPoint: timeAtCurrentPoint + 1,
        distanceAlongRoute: preIntersectionPoseDistanceAlongRoute,
      };
      scenarioPoints.push(contactNewFrequency);

      const passMessage: ScenarioPoint = {
        index: pointIndex++,
        stage: ChangeZoneStage.PassMessage,
        pose: preIntersectionPose,
        updateData: {
          currentContext: `You are currently flying in ${currentAirspace.name}, you should pass your message to the new frequency ${newFreq}`,
          callsignModified: false,
          squark: false,
          currentTarget: currentAirspace.name,
          currentTargetFrequency: newFreq,
          currentTransponderFrequency: "7000",
          currentPressure: 1013,
          emergency: EmergencyType.None,
        },
        nextWaypointIndex: i + 1,
        timeAtPoint: timeAtCurrentPoint + 2,
        distanceAlongRoute: preIntersectionPoseDistanceAlongRoute,
      };
      scenarioPoints.push(passMessage);

      const squawk: ScenarioPoint = {
        index: pointIndex++,
        stage: ChangeZoneStage.Squawk,
        pose: preIntersectionPose,
        updateData: {
          currentContext: `You are currently flying in ${currentAirspace.name}, you should squawk the correct code`,
          callsignModified: false,
          squark: false,
          currentTarget: currentAirspace.name,
          currentTargetFrequency: newFreq,
          currentTransponderFrequency: squarkCode,
          currentPressure: 1013,
          emergency: EmergencyType.None,
        },
        nextWaypointIndex: i + 1,
        timeAtPoint: timeAtCurrentPoint + 2,
        distanceAlongRoute: preIntersectionPoseDistanceAlongRoute,
      };
      scenarioPoints.push(squawk);

      const readbackApproval: ScenarioPoint = {
        index: pointIndex++,
        stage: ChangeZoneStage.ReadbackApproval,
        pose: intersectionPose,
        updateData: {
          currentContext: `You are currently flying in ${currentAirspace.name}, you have been approved to change frequency to ${newFreq}, you should acknowledge this.`,
          callsignModified: false,
          squark: false,
          currentTarget: currentAirspace.name,
          currentTargetFrequency: newFreq,
          currentTransponderFrequency: "7000",
          currentPressure: 1013,
          emergency: EmergencyType.None,
        },
        nextWaypointIndex: i + 1,
        timeAtPoint: timeAtCurrentPoint + 3,
        distanceAlongRoute: intersectionPoseDistanceAlongRoute,
      };
      scenarioPoints.push(readbackApproval);
    }

    endStageIndexes.push(scenarioPoints.length - 1);

    previousPosition = airspaceIntersectionPoints[i]!.position as [
      number,
      number,
    ];

    timeAtPreviousPoint = timeAtCurrentPoint + 3;

    if (switchingAirspace) i++;
  }

  if (hasEmergency && scenarioPoints.length > 0) {
    // Add emergency before a random waypoint on the route
    const emergencyScenarioPointIndex =
      endStageIndexes[seed % (endStageIndexes.length - 1)]! - 1;

    // Get a random emergency type which is not none
    const emergencyTypeIndex = seed % (Object.keys(EmergencyType).length - 1);
    const emergencyType = Object.values(EmergencyType)[emergencyTypeIndex + 1]!;

    // Generate the points to add on the route
    // Get the percentage of the distance between the two points to add the emergency at
    // At least 5% of the distance must be between the two points, and at most 90%
    // This minimises the chance of the emergency ending after the next actual route point time
    const lerpPercentage: number = (seed % 85) / 100 + 0.05;
    const segmentDistance: number = turf.distance(
      scenarioPoints[emergencyScenarioPointIndex]!.pose.position,
      scenarioPoints[emergencyScenarioPointIndex + 1]!.pose.position,
    );
    const emergencyPosition: Position = turf.along(
      turf.lineString([
        scenarioPoints[emergencyScenarioPointIndex]!.pose.position,
        scenarioPoints[emergencyScenarioPointIndex + 1]!.pose.position,
      ]),
      segmentDistance * lerpPercentage,
    ).geometry.coordinates;
    emergencyPosition[0] = parseFloat(emergencyPosition[0]!.toFixed(8));
    emergencyPosition[1] = parseFloat(emergencyPosition[1]!.toFixed(8));

    const emergencyTime: number = Math.round(
      lerp(
        scenarioPoints[emergencyScenarioPointIndex]!.timeAtPoint,
        scenarioPoints[emergencyScenarioPointIndex + 1]!.timeAtPoint,
        lerpPercentage,
      ),
    );

    const emergencyPose: AircraftPose = {
      position: emergencyPosition,
      trueHeading:
        scenarioPoints[emergencyScenarioPointIndex]!.pose.trueHeading,
      altitude: 1200.0,
      airSpeed: 90.0,
    };
    const emergencyPoseDistanceAlongRoute = calculateDistanceAlongRoute(
      waypointCoords,
      emergencyPose.position,
    );

    const declareEmergency: ScenarioPoint = {
      index: pointIndex++,
      stage: PanPanStage.DeclareEmergency,
      pose: emergencyPose,
      updateData: {
        currentContext: `You are currently flying in ${scenarioPoints[emergencyScenarioPointIndex]!.updateData.currentTarget}, you should declare an emergency of type ${emergencyType}`,
        callsignModified: false,
        squark: false,
        currentTarget:
          scenarioPoints[emergencyScenarioPointIndex]!.updateData.currentTarget,
        currentTargetFrequency:
          scenarioPoints[emergencyScenarioPointIndex]!.updateData
            .currentTargetFrequency,
        currentTransponderFrequency: "7000",
        currentPressure: 1013,
        emergency: emergencyType,
      },
      nextWaypointIndex:
        scenarioPoints[emergencyScenarioPointIndex]!.nextWaypointIndex,
      timeAtPoint: emergencyTime,
      distanceAlongRoute: emergencyPoseDistanceAlongRoute,
    };

    const wilcoInstructions: ScenarioPoint = {
      index: pointIndex++,
      stage: PanPanStage.WilcoInstructions,
      pose: emergencyPose,
      updateData: {
        currentContext: `You are currently flying in ${scenarioPoints[emergencyScenarioPointIndex]!.updateData.currentTarget}, you should acknowledge the emergency instructions`,
        callsignModified: false,
        squark: false,
        currentTarget:
          scenarioPoints[emergencyScenarioPointIndex]!.updateData.currentTarget,
        currentTargetFrequency:
          scenarioPoints[emergencyScenarioPointIndex]!.updateData
            .currentTargetFrequency,
        currentTransponderFrequency: "7000",
        currentPressure: 1013,
        emergency: emergencyType,
      },
      nextWaypointIndex:
        scenarioPoints[emergencyScenarioPointIndex]!.nextWaypointIndex,
      timeAtPoint: emergencyTime + 1,
      distanceAlongRoute: emergencyPoseDistanceAlongRoute,
    };

    const cancelPanPan: ScenarioPoint = {
      index: pointIndex++,
      stage: PanPanStage.CancelPanPan,
      pose: emergencyPose,
      updateData: {
        currentContext: `You are currently flying in ${scenarioPoints[emergencyScenarioPointIndex]!.updateData.currentTarget}, you have resolved your emergency, you should cancel the emergency call`,
        callsignModified: false,
        squark: false,
        currentTarget:
          scenarioPoints[emergencyScenarioPointIndex]!.updateData.currentTarget,
        currentTargetFrequency:
          scenarioPoints[emergencyScenarioPointIndex]!.updateData
            .currentTargetFrequency,
        currentTransponderFrequency: "7000",
        currentPressure: 1013,
        emergency: emergencyType,
      },
      nextWaypointIndex:
        scenarioPoints[emergencyScenarioPointIndex]!.nextWaypointIndex,
      timeAtPoint: emergencyTime + 4,
      distanceAlongRoute: emergencyPoseDistanceAlongRoute,
    };

    scenarioPoints.splice(
      emergencyScenarioPointIndex,
      0,
      ...[declareEmergency, wilcoInstructions, cancelPanPan],
    );
  }

  return scenarioPoints;
}
