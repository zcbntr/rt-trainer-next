"use client";

import * as React from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { CircleLayerSpecification, MapMouseEvent } from "mapbox-gl";
import * as turf from "@turf/turf";
import useRouteStore from "~/app/stores/route-slice";
import { useMemo } from "react";
import { Waypoint, WaypointType } from "~/lib/types/waypoint";
import { randomString } from "~/lib/utils";
import {
  getNRandomPhoneticAlphabetLetters,
  getNthPhoneticAlphabetLetter,
} from "~/lib/sim-utils/phonetics";
import { MdPinDrop } from "react-icons/md";

const layerStyle: CircleLayerSpecification = {
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

  const waypoints: Waypoint[] = useRouteStore((state) => state.waypoints);
  const addWaypoint = useRouteStore((state) => state.addWaypoint);

  const markers = useMemo(() => {
    return waypoints.map((waypoint) => {
      return (
        <Marker
          key={waypoint.id}
          longitude={waypoint.location[0]}
          latitude={waypoint.location[1]}
          color="red"
        ></Marker>
      );
    });
  }, [waypoints]);

  const GEOFENCE = turf.circle([-122.4, 37.8], 200, {
    units: "miles",
  });

  const [viewState, setViewState] = React.useState<ViewStateType>({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 1,
  });

  const onMove = React.useCallback(
    ({ viewState }: { viewState: ViewStateType }) => {
      const newCenter = [viewState.longitude, viewState.latitude];
      // Only update the view state if the center is inside the geofence
      // if (turf.booleanPointInPolygon(newCenter, GEOFENCE)) {
      setViewState(viewState);
      // }
    },
    [],
  );

  const onDoubleClick = React.useCallback(
    (e: MapMouseEvent) => {
      // e.g. Waypoint Golf X-Ray
      const waypointName = `Waypoint ${getNRandomPhoneticAlphabetLetters(2)}`;

      addWaypoint({
        id: `waypoint-${randomString(6)}`,
        location: [e.lngLat.lng, e.lngLat.lat],
        type: WaypointType.GPS,
        index: waypoints.length,
        name: waypointName,
      });
    },
    [addWaypoint, waypoints],
  );

  return (
    <div className={`h-full min-h-96 w-full min-w-96 ${className}`}>
      <Map
        {...viewState}
        reuseMaps
        doubleClickZoom={false}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
        onMove={onMove}
        onDblClick={onDoubleClick}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
      >
        {/* <Source id="airspace-data" type="geojson" data={null}>
          <Layer {...layerStyle} />
        </Source> */}
        {markers}
      </Map>
    </div>
  );
};

export default RoutePlannerMap;
