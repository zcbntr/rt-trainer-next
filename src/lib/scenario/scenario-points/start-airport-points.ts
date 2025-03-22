import { Airport } from "~/lib/types/airport";
import { Airspace } from "~/lib/types/airspace";
import {
  AircraftPose,
  EmergencyType,
  ScenarioPoint,
} from "~/lib/types/scenario";
import { Waypoint } from "~/lib/types/waypoint";
import { seedStringToNumber } from "~/lib/utils";
import {
  generateMETORData,
  getParkedFrequency,
  getPointAlongRunwayVector,
  getScenarioStartTime,
  getTakeoffRunwayFromSeed,
  isAirportControlled,
} from "~/lib/sim-utils/airport-fns";
import { Position } from "geojson";
import { METORDataSample } from "~/lib/types/metor-data";
import getMETORSample from "~/lib/sim-utils/metor-fns";
import {
  calculateDistanceAlongRoute,
  findIntersections,
} from "~/lib/sim-utils/route";
import { bearing, destination } from "@turf/turf";
import {
  ClimbOutStage,
  StartUpStage,
  TakeOffStage,
  TaxiStage,
} from "../stages";
import { replaceWithPhoneticAlphabet } from "~/lib/sim-utils/phonetics";
import { getTakeoffRunwayTaxiwayHoldingPoint } from "~/lib/sim-utils/radio-call";

/* Get the start aerodrome states. This includes all stages of:     
    Start up,
    Taxiing,
    TakeOff,
    Climb Out of the start aerodrome's airspace.
     */
export function getStartAirportScenarioPoints(
  seedString: string,
  callsign: string,
  prefix: string,
  waypoints: Waypoint[],
  airspaces: Airspace[],
  startAirport: Airport,
): ScenarioPoint[] {
  let pointIndex = 0;
  const seed = seedStringToNumber(seedString);
  const stages: ScenarioPoint[] = [];
  const scenarioStartTime: number = getScenarioStartTime(seed);
  const startAirportShortName = startAirport.name.split(" ")[0];
  const takeoffRunway = getTakeoffRunwayFromSeed(startAirport.runways, seed);
  const initialRouteHeading = Math.round(
    bearing(waypoints[0]!.location, waypoints[1]!.location),
  );
  const parkedFrequency = getParkedFrequency(startAirport);
  if (!parkedFrequency) {
    throw new Error("No parked frequency found for airport");
  }

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
    // ---------------------------------------------------
    //                  Controlled airport
    // ---------------------------------------------------
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
    const metorSample: METORDataSample = getMETORSample(
      seed,
      generateMETORData(
        startAirport.geometry.coordinates[1],
        startAirport.geometry.coordinates[0],
      ),
    );

    const radioCheck: ScenarioPoint = {
      index: pointIndex++,
      stage: StartUpStage.RadioCheck,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at ${startAirportShortName}, you should contact ${parkedFrequency.name} on ${parkedFrequency.value}`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(radioCheck);

    const requestDepartInfo: ScenarioPoint = {
      index: pointIndex++,
      stage: StartUpStage.DepartureInformationRequest,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at ${startAirportShortName}, you should contact ${parkedFrequency.name} on ${parkedFrequency.value}`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(requestDepartInfo);

    const readbackDepartInfo: ScenarioPoint = {
      index: pointIndex++,
      stage: StartUpStage.ReadbackDepartureInformation,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 1,
      distanceAlongRoute: 0,
      // No response expected
      currentContext: `You are currently parked at 
            ${startAirportShortName}
            you have made contact with
            ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackDepartInfo);

    const taxiRequestResponse = `${prefix} ${replaceWithPhoneticAlphabet(
      callsign,
    )}, taxi to holding point ${getTakeoffRunwayTaxiwayHoldingPoint()}. Hold short of runway ${
      takeoffRunway.designator
    }, QNH ${metorSample.pressure}`;

    const taxiRequest: ScenarioPoint = {
      index: pointIndex++,
      stage: TaxiStage.TaxiRequest,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 1,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at 
            ${startAirportShortName}
            you have made contact with
            ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(taxiRequest);

    const taxiClearanceReadback: ScenarioPoint = {
      index: pointIndex++,
      stage: TaxiStage.TaxiClearanceReadback,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 5,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at 
            ${startAirportShortName}
            you have made contact with
            ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(taxiClearanceReadback);

    const readyForDepartureResponse = `${prefix} ${replaceWithPhoneticAlphabet(
      callsign,
    )}, runway ${takeoffRunway.designator}, QNH ${metorSample.pressure}`;

    const readyForDeparture: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.ReadyForDeparture,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 8,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readyForDeparture);

    const readbackAfterDepartureInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.ReadbackAfterDepartureInformation,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 9,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackAfterDepartureInformation);

    const readbackClearance: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.ReadbackClearance,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 9,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackClearance);

    const readbackNextContact: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.ReadbackNextContact,
      pose: climbingOutPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 12,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        climbingOutPose.position,
      ),
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackNextContact);

    const contactNextFrequency: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.ContactNextFrequency,
      pose: climbingOutPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 15,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        climbingOutPose.position,
      ),
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(contactNextFrequency);

    const acknowledgeNewFrequencyRequest: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.AcknowledgeNewFrequencyRequest,
      pose: climbingOutPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 15,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        climbingOutPose.position,
      ),
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(acknowledgeNewFrequencyRequest);

    const reportLeavingZone: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.ReportLeavingZone,
      pose: leavingZonePose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 18,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        leavingZonePose.position,
      ),
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportLeavingZone);
  } else {
    // ---------------------------------------------------
    //                Uncontrolled airport
    // ---------------------------------------------------
    const firstRouteSegment = [waypoints[0]!.location, waypoints[1]!.location];
    let leavingZonePosition: Position = [0, 0];
    if (takeoffAirspace)
      leavingZonePosition = findIntersections(firstRouteSegment, [
        takeoffAirspace,
      ])[0]!.position;
    else
      leavingZonePosition = destination(
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
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at ${startAirportShortName}, you should contact ${parkedFrequency.name} on ${parkedFrequency.value}`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(radioCheck);

    const requestTaxiInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: TaxiStage.RequestTaxiInformation,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 1,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at ${startAirportShortName}, you should contact ${parkedFrequency.name} on ${parkedFrequency.value}`,
      callsignModified: false, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(requestTaxiInformation);

    const readbackTaxiInformation: ScenarioPoint = {
      index: pointIndex++,
      stage: TaxiStage.AnnounceTaxiing,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 1,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at 
            ${startAirportShortName}
            you have made contact with
            ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readbackTaxiInformation);

    const readyForDeparture: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.ReadyForDeparture,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 8,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(readyForDeparture);

    const acknowledgeTraffic: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.AcknowledgeTraffic,
      pose: groundedPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 9,
      distanceAlongRoute: 0,
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(acknowledgeTraffic);

    const reportTakingOff: ScenarioPoint = {
      index: pointIndex++,
      stage: TakeOffStage.AnnounceTakingOff,
      pose: takingOffPose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 10,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        takingOffPose.position,
      ),
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportTakingOff);

    const reportLeavingZone: ScenarioPoint = {
      index: pointIndex++,
      stage: ClimbOutStage.AnnounceLeavingZone,
      pose: leavingZonePose,
      nextWaypointIndex: 0,
      timeAtPoint: scenarioStartTime + 15,
      distanceAlongRoute: calculateDistanceAlongRoute(
        waypointCoords,
        leavingZonePose.position,
      ),
      currentContext: `You are currently parked at 
      ${startAirportShortName}
      you have made contact with
      ${parkedFrequency.name} on ${parkedFrequency.value}, you should request taxi clearance.`,
      callsignModified: true, // States whether callsign has been modified by ATC, e.g. shortened
      squark: false,
      currentTargetFrequency: parkedFrequency,
      currentTransponderFrequency: "7000",
      currentPressure: 1013,
      emergency: EmergencyType.None,
    };
    stages.push(reportLeavingZone);
  }

  return stages;
}
