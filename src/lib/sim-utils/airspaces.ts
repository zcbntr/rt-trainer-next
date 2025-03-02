import { type Airspace } from "../types/airspace";

export function getAirspaceLowerLimitFL(airspace: Airspace): number {
  /* 	The vertical limit unit. Possbile values:
    0: Meter
    1: Feet
    6: Flight Level 
  */

  if (airspace.lowerLimit.unit == 6) {
    return airspace.lowerLimit.value;
  } else if (airspace.lowerLimit.unit == 1) {
    return airspace.lowerLimit.value / 100;
  } else if (airspace.lowerLimit.unit == 0) {
    return airspace.lowerLimit.value / 30.48;
  } else {
    throw new Error("Invalid unit for lower limit");
  }
}
