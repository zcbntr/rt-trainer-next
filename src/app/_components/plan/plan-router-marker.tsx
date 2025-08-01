import { useRef, useState } from "react";
import { MdLocationPin } from "react-icons/md";
import { Marker } from "react-map-gl/mapbox";
import { type Airspace } from "~/lib/types/airspace";
import { type Waypoint } from "~/lib/types/waypoint";
import { isInUKBoundary } from "~/lib/utils/geojson-utils";

type RouteMarkerProps = {
  waypoint: Waypoint;
  airspaces: Airspace[];
  onValidMove: (
    id: string,
    lngLat: [number, number],
    airspaces: Airspace[],
  ) => void;
};

export const RouteMarker: React.FC<RouteMarkerProps> = ({
  waypoint,
  airspaces,
  onValidMove,
}: RouteMarkerProps) => {
  const lastValidPos = useRef<[number, number]>(waypoint.location);
  const [isDraggingOutOfBounds, setIsDraggingOutOfBounds] = useState(false);

  return (
    <Marker
      longitude={waypoint.location[0]}
      latitude={waypoint.location[1]}
      draggable
      offset={[0, -16]}
      onDragStart={(e) => {
        lastValidPos.current = e.lngLat.toArray();
        setIsDraggingOutOfBounds(false);
      }}
      onDrag={(e) => {
        const lngLat = e.lngLat.toArray();
        const valid = isInUKBoundary(lngLat);

        // Don't snap — just change appearance
        setIsDraggingOutOfBounds(!valid);
      }}
      onDragEnd={(e) => {
        const lngLat = e.lngLat.toArray();
        const valid = isInUKBoundary(lngLat);

        if (valid) {
          onValidMove(waypoint.id, lngLat, airspaces);
        } else {
          // Only snap back once dragging ends
          e.target.setLngLat(lastValidPos.current);
        }

        setIsDraggingOutOfBounds(false);
      }}
    >
      <div
        className="flex rounded-full p-4 transition-opacity duration-300"
        style={{ opacity: isDraggingOutOfBounds ? 0.4 : 1 }}
      >
        <MdLocationPin size="3em" color="red" />
      </div>
    </Marker>
  );
};
