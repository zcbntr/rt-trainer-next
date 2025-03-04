"use client";

import * as React from "react";
import Map, { Source, Layer, Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { type LayerSpecification, type MapMouseEvent } from "mapbox-gl";
import * as turf from "@turf/turf";
import useRoutePlannerStore from "~/app/stores/route-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Waypoint, WaypointType } from "~/lib/types/waypoint";
import { randomString } from "~/lib/utils";
import { getNRandomPhoneticAlphabetLetters } from "~/lib/sim-utils/phonetics";
import { MdLocationPin } from "react-icons/md";
import useAeronauticalDataStore from "~/app/stores/aeronautical-data-store";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";
import { getAirspaceLowerLimitFL } from "~/lib/sim-utils/airspaces";

const routeLayerStyle: LayerSpecification = {
  id: "route",
  type: "line",
  source: "route",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": "#A44",
    "line-width": 6,
    "line-opacity": 0.5,
  },
};

const airspaceLayerStyle: LayerSpecification = {
  id: "airspaces",
  type: "line",
  source: "airspaces",
  paint: {
    "line-color": "#08C",
    "line-width": 1,
  },
};

const matzLayerStyle: LayerSpecification = {
  id: "matzs",
  type: "line",
  source: "matzs",
  paint: {
    "line-color": "#900",
    "line-width": 1,
  },
};

const airportLayerStyle: LayerSpecification = {
  id: "airports",
  type: "symbol",
  source: "airports",
  layout: {
    "icon-image": "circle-stroked-15",
    "icon-size": 0.5,
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

  const mapRef = useRef<MapRef>(null);

  const waypoints: Waypoint[] = useRoutePlannerStore(
    (state) => state.waypoints,
  );
  const airspaces: Airspace[] = useAeronauticalDataStore(
    (state) => state.airspaces,
  );
  const airports: Airport[] = useAeronauticalDataStore(
    (state) => state.airports,
  );
  const airspacesOnRoute: Airspace[] = useRoutePlannerStore(
    (state) => state.airspacesOnRoute,
  );
  const maxFL: number = useRoutePlannerStore((state) => state.maxFL);
  const showAirspacesAboveMaxFL: boolean = useRoutePlannerStore(
    (state) => state.showAirspacesAboveMaxFL,
  );
  const showOnlyOnRouteAirspaces: boolean = useRoutePlannerStore(
    (state) => state.showOnlyOnRouteAirspaces,
  );

  const addWaypoint = useRoutePlannerStore((state) => state.addWaypoint);
  const moveWaypoint = useRoutePlannerStore((state) => state.moveWaypoint);
  const setAirspaces = useAeronauticalDataStore((state) => state.setAirspaces);

  useEffect(() => {
    async function fetchAirspaces() {
      // Lazy load airspaces/airports into stores
      const freshAirspaces: Airspace[] =
        (
          await fetch("/api/aeronautical-data/airspaces").then((res) =>
            res.json(),
          )
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ).data as Airspace[];

      setAirspaces(freshAirspaces);
    }

    async function fetchAirports() {
      const freshAirports: Airport[] =
        (
          await fetch("/api/aeronautical-data/airports").then((res) =>
            res.json(),
          )
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
    const airspacesToUse = showOnlyOnRouteAirspaces
      ? airspacesOnRoute
      : airspaces;

    if (airspacesToUse.length === 0) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(
      airspacesToUse
        .map((airspace) => {
          const lowerLimitFL = getAirspaceLowerLimitFL(airspace);

          if (
            airspace.type != 14 &&
            (showAirspacesAboveMaxFL || lowerLimitFL < maxFL)
          )
            return turf.polygon(airspace.geometry.coordinates);
        })
        .filter((x) => x != undefined),
    );
  }, [
    airspaces,
    airspacesOnRoute,
    maxFL,
    showAirspacesAboveMaxFL,
    showOnlyOnRouteAirspaces,
  ]);

  const matzsGeoJSONData = useMemo(() => {
    const airspacesToUse = showOnlyOnRouteAirspaces
      ? airspacesOnRoute
      : airspaces;

    if (airspacesToUse.length === 0) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(
      airspacesToUse
        .map((airspace) => {
          const lowerLimitFL = getAirspaceLowerLimitFL(airspace);

          if (
            airspace.type == 14 &&
            (showAirspacesAboveMaxFL || lowerLimitFL < maxFL)
          )
            return turf.polygon(airspace.geometry.coordinates);
        })
        .filter((x) => x != undefined),
    );
  }, [
    airspaces,
    airspacesOnRoute,
    maxFL,
    showAirspacesAboveMaxFL,
    showOnlyOnRouteAirspaces,
  ]);

  const airportsGeoJSONData = useMemo(() => {
    if (airports.length === 0) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(
      airports.map((airport) =>
        turf.point(airport.geometry.coordinates, { name: airport.name }),
      ),
    );
  }, [airports]);

  const routeMarkers = useMemo(() => {
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
            moveWaypoint(waypoint.id, [e.lngLat.lng, e.lngLat.lat], airspaces);
          }}
        >
          <div className="flex rounded-full p-4">
            <MdLocationPin size="3em" color="red" />
          </div>
        </Marker>
      );
    });
  }, [moveWaypoint, waypoints, airspaces]);

  const routeLine = useMemo(() => {
    if (waypoints.length < 2) {
      return turf.featureCollection([]);
    }

    return turf.lineString(waypoints.map((waypoint) => waypoint.location));
  }, [waypoints]);

  // Set initial map view to point roughly in the center of the UK zoomed out to mostly get the UK in view
  const [viewState, setViewState] = useState<ViewStateType>({
    longitude: -1.83912391365976,
    latitude: 53.34537967335982,
    zoom: 6,
  });

  const checkIfPositionInViewport = (lat: number, lng: number) => {
    const bounds = mapRef?.current?.getBounds();

    if (bounds) return bounds.contains([lng, lat]);
  };

  const onMove = useCallback(({ viewState }: { viewState: ViewStateType }) => {
    setViewState(viewState);
  }, []);

  const onMapClick = useCallback(
    (e: MapMouseEvent) => {
      const nearestAirport = turf.nearestPoint(
        turf.point([e.lngLat.lng, e.lngLat.lat]),
        turf.featureCollection(
          airports.map((airport) =>
            turf.point(airport.geometry.coordinates, { name: airport.name }),
          ),
        ),
      );

      const distanceToNearestPoint = turf.distance(
        nearestAirport,
        turf.point([e.lngLat.lng, e.lngLat.lat]),
      );

      // Check if the nearest airport is close enough to the click location,
      // threshold scaled by zoom level to make it harder to accidentally add waypoints
      if (distanceToNearestPoint < 2000 / Math.pow(viewState.zoom, 4)) {
        const airport = airports.find(
          (airport) =>
            airport.geometry.coordinates[0] ==
              nearestAirport.geometry.coordinates[0] &&
            airport.geometry.coordinates[1] ==
              nearestAirport.geometry.coordinates[1],
        );

        if (!airport) return;

        // Check no other waypoint has the exact same location
        if (waypoints.length > 0) {
          const waypointAlreadyExists = waypoints.some(
            (waypoint) => waypoint.location == airport.geometry.coordinates,
          );

          if (waypointAlreadyExists) return;
        }

        const waypointName = `Waypoint ${airport.name}`;

        addWaypoint(
          {
            id: `waypoint-${airport.name}-${randomString(6)}`,
            location: airport.geometry.coordinates,
            type: WaypointType.Airport,
            index: waypoints.length,
            name: waypointName,
          },
          airspaces,
        );
      }
    },
    [addWaypoint, airports, viewState.zoom, waypoints, airspaces],
  );

  const onMapDoubleClick = useCallback(
    (e: MapMouseEvent) => {
      // Check no other waypoint has the exact same location
      if (waypoints.length > 0) {
        const waypointAlreadyExists = waypoints.some(
          (waypoint) =>
            waypoint.location[0] == e.lngLat.lng &&
            waypoint.location[1] == e.lngLat.lat,
        );

        if (waypointAlreadyExists) return;
      }

      // e.g. Waypoint Golf X-Ray
      const waypointName = `Waypoint ${getNRandomPhoneticAlphabetLetters(2)}`;

      addWaypoint(
        {
          id: `waypoint-${randomString(6)}`,
          location: [e.lngLat.lng, e.lngLat.lat],
          type: WaypointType.GPS,
          index: waypoints.length,
          name: waypointName,
        },
        airspaces,
      );
    },
    [addWaypoint, waypoints, airspaces],
  );

  return (
    <div className={`h-full min-h-96 w-full min-w-96 ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        reuseMaps
        doubleClickZoom={false}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
        onMove={onMove}
        onClick={onMapClick}
        onDblClick={onMapDoubleClick}
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
        {routeMarkers}
      </Map>
    </div>
  );
};

export default RoutePlannerMap;
