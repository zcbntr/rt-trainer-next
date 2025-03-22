import {
  getSeededTimeInMinutes,
  getRandomFrequencyFromSeed,
  getRandomSqwuakCodeFromSeed,
  lerp,
} from "~/lib/sim-utils";
import {
  type Intersection,
  calculateDistanceAlongRoute,
} from "~/lib/sim-utils/route";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";
import {
  type ScenarioPoint,
  type AircraftPose,
  EmergencyType,
} from "~/lib/types/scenario";
import { type Waypoint } from "~/lib/types/waypoint";
import { seedStringToNumber } from "~/lib/utils";
import { ChangeZoneStage, PanPanStage } from "../stages";
import {
  bearingToAzimuth,
  along,
  destination,
  bearing,
  distance,
  lineString,
} from "@turf/turf";
import { type Position } from "geojson";

export const AIRCRAFT_AVERAGE_SPEED = 3.75; // km per minute. 225 km/h, 120 knots, 140 mph (Cessna 172 max cruise speed)
export const FLIGHT_TIME_MULTIPLIER = 1.3; // Multiplier to account for climb, descent and other factors. Very rough estimate

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
    const distanceFromPrevPoint: number = distance(
      previousPosition,
      airspaceIntersectionPoints[i]!.position,
      { units: "kilometers" },
    );
    let distanceToNextPoint = -1;
    if (i < airspaceIntersectionPoints.length - 1) {
      distanceToNextPoint = distance(
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
      bearingToAzimuth(
        bearing(previousPosition, airspaceIntersectionPoints[i]!.position),
      ),
    );

    const preIntersectionPose: AircraftPose = {
      position: destination(
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
    const segmentDistance: number = distance(
      scenarioPoints[emergencyScenarioPointIndex]!.pose.position,
      scenarioPoints[emergencyScenarioPointIndex + 1]!.pose.position,
    );
    const emergencyPosition: Position = along(
      lineString([
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
