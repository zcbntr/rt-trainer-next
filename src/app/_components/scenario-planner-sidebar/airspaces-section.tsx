import useRoutePlannerStore from "~/app/stores/route-store";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

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
    </div>
  );
};

export default AirspacesSection;
