import { polygon } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

// Example polygon (you'd replace this with actual UK FIR polygon)
const ukAirspace = polygon([
  [
    [-8.6, 49.9],
    [2.1, 49.9],
    [2.1, 61.0],
    [-8.6, 61.0],
    [-8.6, 49.9],
  ],
]);

export function isInUKBoundary(lngLat: [number, number]): boolean {
  return booleanPointInPolygon(lngLat, ukAirspace);
}
