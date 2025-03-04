"use client";

import useAircraftDataStore from "~/app/stores/aircraft-data-store";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const AircraftSection = () => {
  const aircraftType = useAircraftDataStore((state) => state.type);
  const callsign = useAircraftDataStore((state) => state.callsign);
  const prefix = useAircraftDataStore((state) => state.prefix);
  const setAircraftType = useAircraftDataStore((state) => state.setType);
  const setCallsign = useAircraftDataStore((state) => state.setCallsign);
  const setPrefix = useAircraftDataStore((state) => state.setPrefix);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex flex-col gap-2">
        <Label>Callsign</Label>
        <Input
          placeholder="Enter a callsign"
          defaultValue={callsign}
          onChange={(e) => {
            setCallsign(e.target.value);
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Aircraft Type</Label>
        <Input
          placeholder="Enter an aircraft type"
          defaultValue={aircraftType}
          onChange={(e) => {
            setAircraftType(e.target.value);
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Prefix</Label>
        <Input
          placeholder="Enter a prefix"
          defaultValue={prefix}
          onChange={(e) => {
            setPrefix(e.target.value);
          }}
        />
      </div>
    </div>
  );
};

export default AircraftSection;
