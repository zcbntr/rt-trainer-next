"use client";

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
  getItem: (key): string => {
    const searchParams = new URLSearchParams(getUrlSearch());
    const storedValue = searchParams.get(key);
    return storedValue ? (JSON.parse(storedValue) as string) : "";
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
  name: "sidebar",
  storage: createJSONStorage<SidebarStateStore>(() => persistentStorage),
};

interface SidebarStateStore {
  section: string;
  setSection: (newSection: string) => void;
}

const useSidebarStore = create(
  persist<SidebarStateStore>(
    (set) => ({
      section: "",
      setSection: (newSection: string) => set(() => ({ section: newSection })),
    }),
    storageOptions,
  ),
);

export default useSidebarStore;
