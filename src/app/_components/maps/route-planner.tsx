"use client";

import * as React from "react";
import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import "mapbox-gl/dist/mapbox-gl.css";

const RoutePlanner = () => {
  if (!process.env.NEXT_PUBLIC_MAPBOX_API_KEY) {
    throw new Error(
      "REACT_APP_MAPBOX_ACCESS_TOKEN is not defined in the environment",
    );
  }

  return (
    <div>
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
        initialViewState={{
          longitude: -122.4,
          latitude: 37.8,
          zoom: 14,
        }}
        style={{ width: 600, height: 400 }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
      />
    </div>
  );
};

export default RoutePlanner;
