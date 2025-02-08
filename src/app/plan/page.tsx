import { MdPlayArrow } from "react-icons/md";
import RoutePlanner from "../_components/maps/route-planner";

export default function Page() {
  return (
    <div className="flex h-full w-full flex-col place-content-center">
      <div className="flex h-full w-full flex-col place-content-center sm:place-content-start">
        <div className="xs:pr-3 flex h-full min-h-96 w-full min-w-96 flex-col">
          <RoutePlanner />
        </div>
        <div className="flex h-20 w-full flex-row">
          <div className="flex flex-row place-content-center p-4">
            <div className="flex flex-col place-content-center">
              <div className="text-sm">Est. Distance</div>
              <div className="text-xl">0</div>
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
      </div>
    </div>
  );
}
