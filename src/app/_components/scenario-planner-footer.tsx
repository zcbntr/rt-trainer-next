"use client";

import { MdOutlinePlayCircleFilled } from "react-icons/md";
import useRoutePlannerStore from "../stores/route-store";
import { getRouteIssues, kmToUnit } from "~/lib/sim-utils/route";
import { Button } from "~/components/ui/button";
import { Waypoint } from "~/lib/types/waypoint";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ScenarioPlannerFooter = () => {
  const router = useRouter();

  const waypoints: Waypoint[] = useRoutePlannerStore(
    (state) => state.waypoints,
  );
  const airportsOnRoute = useRoutePlannerStore(
    (state) => state.airportsOnRoute,
  );
  const distance: number = useRoutePlannerStore((state) => state.distanceKM);
  const distanceUnit: string = useRoutePlannerStore(
    (state) => state.distanceDisplayUnit,
  );
  const airspacesOnRoute = useRoutePlannerStore(
    (state) => state.airspacesOnRoute,
  );

  const displayDistance = kmToUnit(distance, distanceUnit).toFixed(2);

  const onPlayButtonClick = () => {
    // Check if the route doesn't have any glaring issues e.g. <2 waypoints, no airports, etc.
    // If it does, show a toast and return
    // Otherwise, start the scenario by navigating to the scenario page with the route data in the URL

    const issues: string[] = getRouteIssues(
      waypoints,
      airspacesOnRoute,
      airportsOnRoute,
    );
    if (issues.length > 0) {
      let message = issues[0];
      if (issues.length > 1) {
        message += `, and ${issues.length - 1} more issues`;
      }

      toast.message("Warning", {
        description: message,
        action: {
          label: "Proceed Anyway",
          onClick: () => router.push("/scenario"),
        },
      });
      return;
    }

    // Start
    router.push("/scenario");
  };

  return (
    <div className="flex h-20 w-full flex-row">
      <div className="flex flex-row place-content-center p-4">
        <div className="flex flex-col place-content-center">
          <div className="text-sm">Est. Distance</div>
          <div className="text-xl">
            {displayDistance} {distanceUnit}
          </div>
        </div>
      </div>
      <div className="vr border-surface-200 dark:border-surface-700 h-full border" />
      <div className="flex flex-row place-content-center p-4">
        <div className="flex flex-col place-content-center">
          <div className="text-sm">Unique Airspaces</div>
          <div className="text-xl">{airspacesOnRoute.length}</div>
        </div>
      </div>
      <div className="vr border-surface-200 dark:border-surface-700 h-full border" />
      <div className="flex flex-row place-content-center p-4">
        <div className="flex flex-col place-content-center">
          <div className="text-sm">Est. Scenario Duration</div>
          <div className="text-xl">0 mins</div>
        </div>
      </div>

      <div className="flex grow flex-row place-content-end gap-3 p-3">
        <div className="flex flex-col place-content-center">
          <Button
            className="btn variant-filled h-10 text-sm"
            onClick={onPlayButtonClick}
          >
            <MdOutlinePlayCircleFilled size="2em" />
            <span>Start</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPlannerFooter;
