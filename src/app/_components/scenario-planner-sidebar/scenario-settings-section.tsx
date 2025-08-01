import { MdOutlineRefresh } from "react-icons/md";
import useScenarioPlannerStore from "~/app/stores/plan-store";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { randomString } from "~/lib/utils";

const ScenarioSettingsSection = () => {
  const maxFL = useScenarioPlannerStore((state) => state.maxFL);
  const distanceUnit = useScenarioPlannerStore(
    (state) => state.distanceDisplayUnit,
  );
  const scenarioSeed = useScenarioPlannerStore((state) => state.scenarioSeed);
  const hasEmergencyEvents = useScenarioPlannerStore(
    (state) => state.hasEmergencyEvents,
  );
  const setDistanceUnit = useScenarioPlannerStore(
    (state) => state.setDistanceUnit,
  );
  const setMaxFL = useScenarioPlannerStore((state) => state.setMaxFL);
  const setScenarioSeed = useScenarioPlannerStore(
    (state) => state.setScenarioSeed,
  );
  const setHasEmergencyEvents = useScenarioPlannerStore(
    (state) => state.setHasEmergencyEvents,
  );

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex flex-col gap-1">
        <Label className="label text-sm">Scenario Seed</Label>
        <div className="flex flex-row gap-2">
          <Input
            id="scenario-seed-input"
            placeholder="Enter a seed"
            defaultValue={scenarioSeed}
            onChange={(e) => {
              setScenarioSeed(e.target.value);
            }}
          />
          <Button
            type="button"
            className="btn variant-filled w-10"
            onClick={() => {
              setScenarioSeed(randomString(6));

              const element = document.getElementById("scenario-seed-input");
              if (element) {
                (element as HTMLInputElement).value = scenarioSeed;
              }
            }}
          >
            <MdOutlineRefresh />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="emergency-events-checkbox"
          defaultChecked={hasEmergencyEvents}
          onCheckedChange={() => setHasEmergencyEvents(!hasEmergencyEvents)}
        />
        <Label>Emergency Events</Label>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Maximum Flight Level</Label>
        <Input
          id="fl-input"
          defaultValue={maxFL}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (value >= 15 && value <= 250) {
              setMaxFL(value);
            }
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <Label>Distance Unit</Label>
        </div>
        <Select
          defaultValue={distanceUnit}
          onValueChange={(value) => setDistanceUnit(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue defaultValue={"nm"} placeholder={"Nautical Miles"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nm">Nautical Miles</SelectItem>
            <SelectItem value="mi">Miles</SelectItem>
            <SelectItem value="km">Kilometers</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ScenarioSettingsSection;
