import { lineString } from "@turf/turf";
import { type Waypoint } from "~/lib/types/waypoint";
import * as polyline from "@mapbox/polyline";
import { numberToAlphabetLetter } from "~/lib/utils";

type StaticPreviewMapProps = {
  className?: string;
  waypoints: Waypoint[];
  width: number;
  height: number;
};

// Currently doesn't show airspaces or airports, just the route
const StaticPreviewMap = async ({
  className,
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

  //   Can be used instead of /auto/ for a custom bounding box
  //   const turfBboxString = `[${bbox(turfLineString).toString()}]`;

  const markerString = waypoints
    .map((waypoint) => {
      return `pin-s-${numberToAlphabetLetter(waypoint.index).toLowerCase()}+000(${waypoint.location[0]},${waypoint.location[1]})`;
    })
    .join(",");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const polylineEncoding = polyline.encode(
    turfLineString.geometry.coordinates.map(
      (coord) => coord.reverse() as [number, number],
    ),
  );

  const imageURL = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markerString},path-4+f00-0.5(${encodeURIComponent(polylineEncoding)})/auto/${width}x${height}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_KEY}`;

  return (
    <div className={`${className} relative`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageURL} alt={"Scenario Map"}></img>
    </div>
  );
};

export default StaticPreviewMap;
