import { lineString, bbox } from "@turf/turf";
import { type Waypoint } from "~/lib/types/waypoint";
import * as polyline from "@mapbox/polyline";

type StaticPreviewMapProps = {
  waypoints: Waypoint[];
  width: number;
  height: number;
};

const StaticPreviewMap = async ({
  waypoints,
  width,
  height,
}: StaticPreviewMapProps) => {
  if (!waypoints?.length) {
    return null;
  }

  const turfLineString = lineString(
    waypoints.map((waypoint) => waypoint.location),
  );

  const turfBboxString = `[${bbox(turfLineString).toString()}]`;

  const markerString = waypoints
    .map((waypoint) => {
      return `pin-s-${waypoint.index + 1}+000(${waypoint.location[0]},${waypoint.location[1]})`;
    })
    .join(",");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const polylineEncoding = polyline.encode(
    turfLineString.geometry.coordinates.map(
      (coord) => coord.reverse() as [number, number],
    ),
  );

  const imageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markerString},path-4+f00-0.5(${encodeURIComponent(polylineEncoding as string)})/auto/${width}x${height}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_KEY}`;

  return (
    <div className="">
      <img src={imageURL} alt={"Scenario Map"}></img>
    </div>
  );
};

export default StaticPreviewMap;
