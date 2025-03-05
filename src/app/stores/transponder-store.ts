import { type TransponderDialMode } from "~/lib/types/simulator";
import { create } from "zustand";
import {
  persist,
  type StateStorage,
  createJSONStorage,
} from "zustand/middleware";

const getUrlSearch = () => {
  return window.location.search.slice(1);
};

const persistentStorage: StateStorage = {
  getItem: (key): string | null => {
    // Check URL first
    if (getUrlSearch()) {
      const searchParams = new URLSearchParams(getUrlSearch());
      const storedValue = searchParams.get(key);
      return JSON.parse(storedValue!) as string;
    } else {
      return null;
    }
  },
  setItem: (key, newValue): void => {
    const searchParams = new URLSearchParams(getUrlSearch());
    searchParams.set(key, JSON.stringify(newValue));
    window.history.replaceState(null, "", `?${searchParams.toString()}`);
  },
  removeItem: (key): void => {
    const searchParams = new URLSearchParams(getUrlSearch());
    searchParams.delete(key);
    window.location.search = searchParams.toString();
  },
};

const storageOptions = {
  name: "transponderState",
  storage: createJSONStorage<TransponderStateStore>(() => persistentStorage),
};

interface TransponderStateStore {
  dialMode: TransponderDialMode;
  frequency: string;
  identEnabled: boolean;
  vfrHasExecuted: boolean;
  setDialMode: (dialMode: TransponderDialMode) => void;
  setFrequency: (frequency: string) => void;
  setIdentEnabled: (identEnabled: boolean) => void;
  setVFRHasExecuted: (vfrHasExecuted: boolean) => void;
}

const useTransponderStore = create(
  persist<TransponderStateStore>(
    (set) => ({
      dialMode: "OFF",
      frequency: "1200",
      identEnabled: false,
      vfrHasExecuted: false,
      setDialMode: (dialMode: TransponderDialMode) =>
        set(() => ({ dialMode: dialMode })),
      setFrequency: (frequency: string) =>
        set(() => ({ frequency: frequency })),
      setIdentEnabled: (identEnabled: boolean) =>
        set(() => ({ identEnabled: identEnabled })),
      setVFRHasExecuted: (vfrHasExecuted: boolean) =>
        set(() => ({ vfrHasExecuted: vfrHasExecuted })),
    }),
    storageOptions,
  ),
);

export default useTransponderStore;
