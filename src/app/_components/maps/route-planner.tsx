"use client";

import * as React from "react";
import Map, { Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { CircleLayer } from "mapbox-gl";
import * as turf from "@turf/turf";

const layerStyle: CircleLayer = {
  id: "point",
  type: "circle",
  paint: {
    "circle-radius": 10,
    "circle-color": "#007cbf",
  },
};

type RoutePlannerProps = {
  className?: string;
};

type ViewStateType = {
  longitude: number;
  latitude: number;
  zoom: number;
};

const RoutePlannerMap = ({ className }: RoutePlannerProps) => {
  if (!process.env.NEXT_PUBLIC_MAPBOX_API_KEY) {
    throw new Error(
      "REACT_APP_MAPBOX_ACCESS_TOKEN is not defined in the environment",
    );
  }

  // A circle of 5 mile radius of the Empire State Building
  const GEOFENCE = turf.circle([-122.4, 37.8], 5, {
    units: "miles",
  });

  const [viewState, setViewState] = React.useState<ViewStateType>({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 14,
  });

  const onMove = React.useCallback(
    ({ viewState }: { viewState: ViewStateType }) => {
      const newCenter = [viewState.longitude, viewState.latitude];
      // Only update the view state if the center is inside the geofence
      if (turf.booleanPointInPolygon(newCenter, GEOFENCE)) {
        setViewState(viewState);
      }
    },
    [],
  );

  return (
    <div className={`h-full min-h-96 w-full min-w-96${className}`}>
      <Map
        {...viewState}
        reuseMaps
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
        onMove={onMove}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
      >
        <Source id="route-data" type="geojson" data={null}>
          <Layer {...layerStyle} />
        </Source>
      </Map>
    </div>
  );
};

export default RoutePlannerMap;
