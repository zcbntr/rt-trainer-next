/**
 * Point in space along a route. Should have a unique id along with its other properties.
 */
export type Waypoint = {
  id: string;
  type: WaypointType;
  location: [number, number];
  index: number;
  name: string;
  referenceObjectId: string | undefined;
  description: string | undefined;
};

export enum WaypointType {
  Airport, // For use when not in the air
  NDB, // Non-directional beacon - helps with positioning
  VOR, // VHF Omnidirectional Range station - helps with positioning
  Fix, // Arbitrary well know easy to spot visual point e.g. a road junction or reservoir
  DME, // Distance Measuring Equipment - helps with positioning by measuring distance from a VOR
  GPS, // GPS waypoint - arbitrary point defined in terms of lat/long
  Intersection, // Intersection of two or more airways
  NewAirspace, // Entering new airspace - changing frequency
  Emergency, // Emergency - no special location
}
