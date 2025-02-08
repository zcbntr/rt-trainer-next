"use client";

import * as React from "react";
import Map, { Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import "mapbox-gl/dist/mapbox-gl.css";
import { CircleLayer } from "mapbox-gl";

const layerStyle: CircleLayer = {
  id: "point",
  type: "circle",
  paint: {
    "circle-radius": 10,
    "circle-color": "#007cbf",
  },
};

const RoutePlanner = () => {
  if (!process.env.NEXT_PUBLIC_MAPBOX_API_KEY) {
    throw new Error(
      "REACT_APP_MAPBOX_ACCESS_TOKEN is not defined in the environment",
    );
  }

  return (
    <div className="h-full min-h-96 w-full min-w-96">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
        initialViewState={{
          longitude: -122.4,
          latitude: 37.8,
          zoom: 14,
        }}
        style={{ width: 600, height: 600 }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
      >
        <Source id="route-data" type="geojson" data={null}>
          <Layer {...layerStyle} />
        </Source>
      </Map>
    </div>
  );
};

export default RoutePlanner;
