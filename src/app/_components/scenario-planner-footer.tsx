"use client";

import { MdPlayArrow } from "react-icons/md";
import useRouteStore from "../stores/route-store";
import { kmToUnit } from "~/lib/sim-utils/route";

const ScenarioPlannerFooter = () => {
  const distance: number = useRouteStore((state) => state.distanceKM);
  const distanceUnit: string = useRouteStore(
    (state) => state.distanceDisplayUnit,
  );

  const displayDistance = kmToUnit(distance, distanceUnit).toFixed(2);

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
          <div className="text-xl">0</div>
        </div>
      </div>
      <div className="vr border-surface-200 dark:border-surface-700 h-full border" />
      <div className="flex flex-row place-content-center p-4">
        <div className="flex flex-col place-content-center">
          <div className="text-sm">Est. Scenario Duration</div>
          <div className="text-xl">0 mins</div>
        </div>
      </div>

      <div className="flex grow flex-row place-content-end gap-3 p-2">
        <div className="flex flex-col place-content-center">
          <button className="btn variant-filled h-10 text-sm">
            <span>
              <MdPlayArrow />
            </span>
            <span>Start</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPlannerFooter;
