/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import * as React from "react";
import Map, { Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { type LayerSpecification, type MapMouseEvent } from "mapbox-gl";
import * as turf from "@turf/turf";
import useScenarioPlannerStore from "~/app/stores/plan-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Waypoint, WaypointType } from "~/lib/types/waypoint";
import { randomString } from "~/lib/utils";
import { getNRandomPhoneticAlphabetLetters } from "~/lib/sim-utils/phonetics";
import useAeronauticalDataStore from "~/app/stores/aeronautical-data-store";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";
import { getAirspaceLowerLimitFL } from "~/lib/sim-utils/airspaces";
import { isInUKBoundary } from "~/lib/utils/geojson-utils";
import { RouteMarker } from "../plan/plan-router-marker";

const AIRPORT_CLICK_THRESHOLD = 3500; // in meters, scaled by zoom level by dividing by zoom^4

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
    "icon-image": "airport-15",
    "icon-size": 1,
  },
  paint: {
    "icon-color": "#08C",
  },
};

type RoutePlannerProps = {
  className?: string;
  initialBBOX?: [number, number, number, number];
};

type ViewStateType = {
  longitude: number;
  latitude: number;
  zoom: number;
  lnglatBounds?: [number, number, number, number];
};

export const ScenarioPlannerMap = ({
  className,
  initialBBOX,
}: RoutePlannerProps) => {
  if (!process.env.NEXT_PUBLIC_MAPBOX_API_KEY) {
    throw new Error(
      "REACT_APP_MAPBOX_ACCESS_TOKEN is not defined in the environment",
    );
  }

  const mapRef = useRef<MapRef>(null);

  const waypoints: Waypoint[] = useScenarioPlannerStore(
    (state) => state.waypoints,
  );
  const airspaces: Airspace[] = useAeronauticalDataStore(
    (state) => state.airspaces,
  );
  const airports: Airport[] = useAeronauticalDataStore(
    (state) => state.airports,
  );
  const airspacesOnRoute: Airspace[] = useScenarioPlannerStore(
    (state) => state.airspacesOnRoute,
  );
  const maxFL: number = useScenarioPlannerStore((state) => state.maxFL);
  const showAirspacesAboveMaxFL: boolean = useScenarioPlannerStore(
    (state) => state.showAirspacesAboveMaxFL,
  );
  const showOnlyOnRouteAirspaces: boolean = useScenarioPlannerStore(
    (state) => state.showOnlyOnRouteAirspaces,
  );

  const addWaypoint = useScenarioPlannerStore((state) => state.addWaypoint);
  const moveWaypoint = useScenarioPlannerStore((state) => state.moveWaypoint);

  useEffect(() => {
    async function fetchAirspaces() {
      // Lazy load airspaces/airports into stores - can trpc not do this type safe?
      const freshAirspaces: Airspace[] = (
        await fetch("/api/aeronautical-data/airspaces").then((res) =>
          res.json(),
        )
      ).data as Airspace[];

      if (freshAirspaces.length < 100) {
        throw new Error(
          "Some airspaces could not be loaded. This may be due to an OpenAIP outage. Please contact support if this persists.",
        );
      }

      useAeronauticalDataStore.setState({ airspaces: freshAirspaces });
    }

    async function fetchAirports() {
      const freshAirports: Airport[] = (
        await fetch("/api/aeronautical-data/airports").then((res) => res.json())
      ).data as Airport[];

      if (freshAirports.length < 50) {
        throw new Error(
          "Some airports could not be loaded. This may be due to an OpenAIP outage. Please contact support if this persists.",
        );
      }

      useAeronauticalDataStore.setState({ airports: freshAirports });
    }

    if (airports.length < 50) {
      void fetchAirports();
    }

    if (airspaces.length < 100) {
      void fetchAirspaces();
    }
  }, [airports.length, airspaces.length]);

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

  useEffect(() => {
    // If no waypoints, fit map to UK
    if (waypoints.length == 0) {
      mapRef.current?.fitBounds([-7.65108, 50.521311, 1.825189, 58.203818], {
        padding: 50,
      });
      return;
    }

    // If only one waypoint, fly to that waypoint
    if (waypoints.length < 2) {
      const waypoint = waypoints[0];
      if (waypoint) {
        mapRef.current?.flyTo({
          center: waypoint.location,
          zoom: 10,
        });
        return;
      }
      // Else fit map to bounding box of waypoints
    } else {
      const [x1, y1, x2, y2] = turf.bbox(
        turf.lineString(waypoints.map((waypoint) => waypoint.location)),
      );

      mapRef.current?.fitBounds([x1, y1, x2, y2], {
        padding: 200,
        duration: 1000,
      });
    }
  }, [waypoints]);

  const routeLine = useMemo(() => {
    if (waypoints.length < 2) {
      return turf.featureCollection([]);
    }

    return turf.lineString(waypoints.map((waypoint) => waypoint.location));
  }, [waypoints]);

  // Set initial map view to point roughly in the center of the UK zoomed out to mostly get the UK in view
  // If initialBBOX is provided, use that instead
  const [viewState, setViewState] = useState<ViewStateType>({
    longitude: -1.83912391365976,
    latitude: 53.34537967335982,
    zoom: 6,
    lnglatBounds: initialBBOX,
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
      if (
        distanceToNearestPoint <
        AIRPORT_CLICK_THRESHOLD / Math.pow(viewState.zoom, 4)
      ) {
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

        const waypointName = `${airport.name}`;

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

        // Add airport to route
        useScenarioPlannerStore.setState((state) => ({
          airportsOnRoute: [...state.airportsOnRoute, airport],
        }));
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

      if (isInUKBoundary(e.lngLat.toArray())) {
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
      }
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
        {waypoints.map((waypoint) => (
          <RouteMarker
            key={waypoint.id}
            waypoint={waypoint}
            airspaces={airspaces}
            onValidMove={moveWaypoint}
          />
        ))}
      </Map>
    </div>
  );
};
