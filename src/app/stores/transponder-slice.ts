import { type TransponderDialMode } from "~/lib/types/simulator";
import { create, type ExtractState } from "zustand";
import { combine } from "zustand/middleware";

// If types play up here turn them into interfaces as shown in https://zustand.docs.pmnd.rs/guides/typescript
// Then extract the type for use elsewhere

export type TransponderState = ExtractState<typeof useTransponderStore>;

const useTransponderStore = create(
  combine(
    {
      dialMode: "OFF",
      frequency: "7000",
      identEnabled: false,
      vfrHasExecuted: false,
    },
    (set) => ({
      setDialMode: (dialMode: TransponderDialMode) =>
        set(() => ({ dialMode: dialMode })),
      setFrequency: (frequency: string) =>
        set(() => ({ frequency: frequency })),
      setIdentEnabled: (identEnabled: boolean) =>
        set(() => ({ identEnabled: identEnabled })),
      setVFRHasExecuted: (vfrHasExecuted: boolean) =>
        set(() => ({ vfrHasExecuted: vfrHasExecuted })),
    }),
  ),
);

export default useTransponderStore;
