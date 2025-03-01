"use client";

import * as React from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { type LayerSpecification, type MapMouseEvent } from "mapbox-gl";
import * as turf from "@turf/turf";
import useRouteStore from "~/app/stores/route-store";
import { useEffect, useMemo } from "react";
import { type Waypoint, WaypointType } from "~/lib/types/waypoint";
import { randomString } from "~/lib/utils";
import { getNRandomPhoneticAlphabetLetters } from "~/lib/sim-utils/phonetics";
import { MdLocationPin } from "react-icons/md";
import useAeronauticalDataStore from "~/app/stores/aeronautical-data-store";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";

const routeLayerStyle: LayerSpecification = {
  id: "route",
  type: "line",
  source: "route",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": "#888",
    "line-width": 8,
  },
};

const airspaceLayerStyle: LayerSpecification = {
  id: "airspaces",
  type: "fill",
  source: "airspaces",
  paint: {
    "fill-color": "#088",
    "fill-opacity": 0.5,
  },
};

const matzLayerStyle: LayerSpecification = {
  id: "matzs",
  type: "fill",
  source: "matzs",
  paint: {
    "fill-color": "#f00",
    "fill-opacity": 0.5,
  },
};

const airportLayerStyle: LayerSpecification = {
  id: "airports",
  type: "symbol",
  source: "airports",
  layout: {
    "icon-image": "airport-15",
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
  const airspaces: Airspace[] = useAeronauticalDataStore(
    (state) => state.airspaces,
  );
  const airports: Airport[] = useAeronauticalDataStore(
    (state) => state.airports,
  );
  const addWaypoint = useRouteStore((state) => state.addWaypoint);
  const moveWaypoint = useRouteStore((state) => state.moveWaypoint);
  const setAirspaces = useAeronauticalDataStore((state) => state.setAirspaces);

  useEffect(() => {
    async function fetchAirspaces() {
      // Lazy load airspaces/airports into stores
      const freshAirspaces: Airspace[] = (
        await fetch("/api/aeronautical-data/airspaces").then((res) =>
          res.json(),
        )
      ).data as Airspace[];

      setAirspaces(freshAirspaces);
    }

    async function fetchAirports() {
      const freshAirports: Airport[] = (
        await fetch("/api/aeronautical-data/airports").then((res) => res.json())
      ).data as Airport[];

      useAeronauticalDataStore.setState({ airports: freshAirports });
    }

    if (airports.length === 0) {
      void fetchAirports();
    }

    if (airspaces.length === 0) {
      void fetchAirspaces();
    }
  }, [airports.length, airspaces.length, setAirspaces]);

  const airspacesGeoJSONData = useMemo(() => {
    if (airspaces.length === 0) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(
      airspaces
        .map((airspace) => {
          if (airspace.type != 14) return turf.polygon(airspace.geometry.coordinates);
        })
        .filter((x) => x != undefined),
    );
  }, [airspaces]);

  const matzsGeoJSONData = useMemo(() => {
    if (airspaces.length === 0) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(
      airspaces
        .map((airspace) => {
          if (airspace.type == 14) return turf.polygon(airspace.geometry.coordinates);
        })
        .filter((x) => x != undefined),
    );
  }, [airspaces]);

  const airportsGeoJSONData = useMemo(() => {
    if (airports.length === 0) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(
      airports.map((airport) => {
        return turf.point(airport.geometry.coordinates);
      }),
    );
  }, [airports]);

  const markers = useMemo(() => {
    return waypoints.map((waypoint) => {
      return (
        <Marker
          key={waypoint.id}
          longitude={waypoint.location[0]}
          latitude={waypoint.location[1]}
          color="red"
          draggable
          offset={[0, -16]}
          // Could do on drag but this would not be performant
          // Instead visuals could update on drag but not route date
          // Otherwise we would do a lot of unnecessary calculations
          onDragEnd={(e) => {
            moveWaypoint(waypoint.id, [e.lngLat.lng, e.lngLat.lat]);
          }}
        >
          <div className="flex rounded-full p-4">
            <MdLocationPin size="3em" color="red" />
          </div>
        </Marker>
      );
    });
  }, [moveWaypoint, waypoints]);

  const routeLine = useMemo(() => {
    if (waypoints.length < 2) {
      return turf.featureCollection([]);
    }

    return turf.lineString(waypoints.map((waypoint) => waypoint.location));
  }, [waypoints]);

  const [viewState, setViewState] = React.useState<ViewStateType>({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 1,
  });

  const onMove = React.useCallback(
    ({ viewState }: { viewState: ViewStateType }) => {
      setViewState(viewState);
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
        <Source id="airspace-data" type="geojson" data={routeLine}>
          <Layer {...routeLayerStyle} />
        </Source>
        <Source id="airports" type="geojson" data={airportsGeoJSONData}>
          <Layer {...airportLayerStyle} />
        </Source>
        <Source id="airspaces" type="geojson" data={airspacesGeoJSONData}>
          <Layer {...airspaceLayerStyle} />
        </Source>
        <Source id="matzs" type="geojson" data={matzsGeoJSONData}>
          <Layer {...matzLayerStyle} />
        </Source>
        {markers}
      </Map>
    </div>
  );
};

export default RoutePlannerMap;
