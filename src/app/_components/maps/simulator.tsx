"use client";

import * as React from "react";
import Map, { Source, Layer, Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { type LayerSpecification, type MapMouseEvent } from "mapbox-gl";
import * as turf from "@turf/turf";
import useRoutePlannerStore from "~/app/stores/route-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Waypoint } from "~/lib/types/waypoint";
import { MdLocationPin } from "react-icons/md";
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
  id: "airportsOnRoute",
  type: "symbol",
  source: "airportsOnRoute",
  layout: {
    "icon-image": "circle-stroked-15",
    "icon-size": 0.5,
  },
};

type SimulatorMapProps = {
  className?: string;
  initialBBOX?: [number, number, number, number];
};

type ViewStateType = {
  longitude: number;
  latitude: number;
  zoom: number;
  lnglatBounds?: [number, number, number, number];
};

const SimulatorMap = ({ className, initialBBOX }: SimulatorMapProps) => {
  if (!process.env.NEXT_PUBLIC_MAPBOX_API_KEY) {
    throw new Error(
      "REACT_APP_MAPBOX_ACCESS_TOKEN is not defined in the environment",
    );
  }

  const mapRef = useRef<MapRef>(null);

  const waypoints: Waypoint[] = useRoutePlannerStore(
    (state) => state.waypoints,
  );
  const airportsOnRoute: Airport[] = useRoutePlannerStore(
    (state) => state.airportsOnRoute,
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

  const airspacesGeoJSONData = useMemo(() => {
    if (airspacesOnRoute.length === 0) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(
      airspacesOnRoute
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
    airspacesOnRoute,
    maxFL,
    showAirspacesAboveMaxFL,
    showOnlyOnRouteAirspaces,
  ]);

  const matzsGeoJSONData = useMemo(() => {
    if (airspacesOnRoute.length === 0) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(
      airspacesOnRoute
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
    airspacesOnRoute,
    maxFL,
    showAirspacesAboveMaxFL,
    showOnlyOnRouteAirspaces,
  ]);

  const airportsGeoJSONData = useMemo(() => {
    if (airportsOnRoute.length === 0) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(
      airportsOnRoute.map((airport) =>
        turf.point(airport.geometry.coordinates, { name: airport.name }),
      ),
    );
  }, [airportsOnRoute]);

  useEffect(() => {
    if (waypoints.length < 2) {
      mapRef.current?.fitBounds([-7.65108, 50.521311, 1.825189, 58.203818], {
        padding: 50,
      });
      return;
    }

    const [x1, y1, x2, y2] = turf.bbox(
      turf.lineString(waypoints.map((waypoint) => waypoint.location)),
    );

    mapRef.current?.fitBounds([x1, y1, x2, y2], {
      padding: 70,
    });
  }, [waypoints]);

  const routeMarkers = useMemo(() => {
    return waypoints.map((waypoint) => {
      return (
        <Marker
          key={waypoint.id}
          longitude={waypoint.location[0]}
          latitude={waypoint.location[1]}
          color="red"
          offset={[0, -16]}
        >
          <div className="flex rounded-full p-4">
            <MdLocationPin size="3em" color="red" />
          </div>
        </Marker>
      );
    });
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
          airportsOnRoute.map((airport) =>
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
        const airport = airportsOnRoute.find(
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
      }
    },
    [airportsOnRoute, viewState.zoom, waypoints],
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
        style={{ width: "100%", height: "100%", borderRadius: "3px" }}
        mapStyle="mapbox://styles/mapbox/streets-v9"
      >
        <Source id="airspace-data" type="geojson" data={routeLine}>
          <Layer {...routeLayerStyle} />
        </Source>
        <Source
          id="airports-en-route"
          type="geojson"
          data={airportsGeoJSONData}
        >
          <Layer {...airportLayerStyle} />
        </Source>
        <Source
          id="airspaces-en-route"
          type="geojson"
          data={airspacesGeoJSONData}
        >
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

export default SimulatorMap;
