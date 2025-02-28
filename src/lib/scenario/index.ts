import { type Airport } from "../types/airport";
import { type Airspace } from "../types/airspace";
import { type ScenarioPoint } from "../types/scenario";
import { type Waypoint } from "../types/waypoint";

export default class Scenario {
  seed: string;

  scenarioPoints: ScenarioPoint[] = [];
  airports: Airport[] = [];
  airspaces: Airspace[] = [];
  waypoints: Waypoint[] = [];

  currentPointIndex = 0;

  constructor(
    seed: string,
    waypoints: Waypoint[],
    airspace: Airspace[],
    airports: Airport[],
    scenarioPoints: ScenarioPoint[],
  ) {
    this.seed = seed;
    this.waypoints = waypoints;
    this.airspaces = airspace;
    this.airports = airports;
    this.scenarioPoints = scenarioPoints;
  }

  public getCurrentPoint(): ScenarioPoint {
    const currentPoint = this.scenarioPoints[this.currentPointIndex];
    if (currentPoint == undefined) {
      throw new Error("Current point is undefined");
    }
    return currentPoint;
  }

  public getPoints(): ScenarioPoint[] {
    return this.scenarioPoints;
  }

  public getStartPoint(): ScenarioPoint {
    const startPoint = this.scenarioPoints[0];
    if (startPoint == undefined) {
      throw new Error("Start point is undefined");
    }
    return startPoint;
  }

  public getEndPoint(): ScenarioPoint {
    const endPoint = this.scenarioPoints[this.scenarioPoints.length - 1];
    if (endPoint == undefined) {
      throw new Error("End point is undefined");
    }
    return endPoint;
  }

  public getStartAirport(): Airport {
    const startAirport = this.airports[0];
    if (startAirport == undefined) {
      throw new Error("Start airport is undefined");
    }
    return startAirport;
  }

  public getEndAirport(): Airport {
    const endAirport = this.airports[this.airports.length - 1];
    if (endAirport == undefined) {
      throw new Error("End airport is undefined");
    }
    return endAirport;
  }
}

// let startPointIndex = 0;
// StartPointIndexStore.subscribe((value) => {
//   startPointIndex = value;
// });
// let endPointIndex = 0;
// EndPointIndexStore.subscribe((value) => {
//   endPointIndex = value;
// });

// export function ResetCurrentRoutePointIndex(): void {
//   CurrentScenarioPointIndexStore.set(startPointIndex);
// }