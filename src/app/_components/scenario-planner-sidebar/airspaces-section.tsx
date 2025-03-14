import { useMemo } from "react";
import useRoutePlannerStore from "~/app/stores/route-store";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { type Airspace } from "~/lib/types/airspace";

const AirspacesSection = () => {
  const showOnlyOnRouteAirspaces = useRoutePlannerStore(
    (state) => state.showOnlyOnRouteAirspaces,
  );
  const showAirspacesAboveMaxFL = useRoutePlannerStore(
    (state) => state.showAirspacesAboveMaxFL,
  );
  const setShowOnlyOnRouteAirspaces = useRoutePlannerStore(
    (state) => state.setShowOnlyOnRouteAirspaces,
  );
  const setShowAirspacesAboveMaxFL = useRoutePlannerStore(
    (state) => state.setShowAirspacesAboveMaxFL,
  );
  const airspacesOnRoute: Airspace[] = useRoutePlannerStore(
    (state) => state.airspacesOnRoute,
  );

  const airspaceOnRouteDetails = useMemo(() => {
    return airspacesOnRoute.map((airspace) => {
      return (
        <div
          key={airspace._id}
          className="flex flex-row items-center gap-2 rounded-md border p-2"
        >
          <div>{`${airspace.name} ${airspace.type == 14 ? "MATZ" : ""}`}</div>
        </div>
      );
    });
  }, [airspacesOnRoute]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex items-center gap-2">
        <Switch
          defaultChecked={showOnlyOnRouteAirspaces}
          onCheckedChange={() =>
            setShowOnlyOnRouteAirspaces(!showOnlyOnRouteAirspaces)
          }
        />
        <Label>Show only enroute airspaces</Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          defaultChecked={showAirspacesAboveMaxFL}
          onCheckedChange={() =>
            setShowAirspacesAboveMaxFL(!showAirspacesAboveMaxFL)
          }
        />
        <Label>Show airspaces with minimum FL above your max FL</Label>
      </div>

      <hr className="border-surface-200 dark:border-surface-700" />

      <div className="flex flex-col gap-2">
        <div className="font-semibold">Airspaces on-route (unordered)</div>
        <div className="flex flex-col gap-2">{airspaceOnRouteDetails}</div>
      </div>
    </div>
  );
};

export default AirspacesSection;
