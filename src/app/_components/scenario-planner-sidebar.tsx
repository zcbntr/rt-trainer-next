"use client";

import {
  MdAirplanemodeActive,
  MdAutoAwesome,
  MdLocationPin,
  MdOutlineMoreHoriz,
  MdOutlineRefresh,
  MdRoute,
  MdSettingsInputComposite,
  MdOutlineKeyboardDoubleArrowLeft,
} from "react-icons/md";
import { Checkbox } from "~/components/ui/checkbox";
import { Textarea } from "~/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { randomString } from "~/lib/utils";
import { generateFRTOLRouteFromSeed } from "~/lib/route-gen";
import { loadRouteData } from "~/lib/scenario/scenario";
import { type Airport } from "~/lib/types/airport";
import { type Airspace } from "~/lib/types/airspace";
import { type Waypoint } from "~/lib/types/waypoint";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { NavUser } from "~/app/_components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";

const sidebarSections = [
  {
    title: "Route Waypoints",
    description:
      "Add a waypoint by clicking on an airport or any other spot on the map. Or use the Auto-generate Tool below.",
    icon: MdLocationPin,
  },
  {
    title: "Scenario Settings",
    description: "Set the seed for the scenario and enable emergency events",
    icon: MdRoute,
  },
  {
    title: "Aircraft Details",
    description: "Set Callsign, Aircraft Type, and other details",
    icon: MdAirplanemodeActive,
  },
  {
    title: "Preferences",
    description: "Set the units and maximum flight level",
    icon: MdSettingsInputComposite,
  },
  {
    title: "Generate",
    description: "Auto-generate a route",
    icon: MdAutoAwesome,
  },
];

export function ScenarioPlannerSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.

  const { setOpen } = useSidebar();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const sidebarSection = searchParams.get("sidebar");

  useEffect(() => {
    if (sidebarSection) {
      const section = sidebarSections.find(
        (item) => item.title === sidebarSection,
      );
      if (section) {
        setActiveSection(section.title);
      } else {
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  });

  let scenarioSeed: string = randomString(6);
  //   ScenarioSeedStore.set(scenarioSeed); // Set initial value
  let hasEmergencyEvents: boolean = true;
  //   HasEmergencyEventsStore.set(hasEmergencyEvents); // Set initial value

  // Route data
  let routeSeed: string = ""; // Only used for seeding the route generator
  let waypoints: Waypoint[] = []; // Stores all the waypoints in the route

  // Aeronautical data
  let airports: Airport[] = [];
  let airspaces: Airspace[] = [];

  // Route preferences
  let distanceUnit: string = "nm";
  let maxFL: number = 30;

  // Blocking new inputs during route generation
  let awaitingServerResponse: boolean = false;
  //   AwaitingServerResponseStore.subscribe((value) => {
  //     awaitingServerResponse = value;
  //   });

  $: {
    if (routeSeed !== "") {
      //   loadSeededRoute();
    }
  }

  //   $: ScenarioSeedStore.set(scenarioSeed);

  //   $: HasEmergencyEventsStore.set(hasEmergencyEvents);

  //   $: RouteDistanceDisplayUnitStore.set(distanceUnit);

  $: {
    maxFL = Math.min(Math.max(15, maxFL), 250);
    // maxFlightLevelStore.set(maxFL);
  }

  //   WaypointsStore.subscribe((value) => {
  //     waypoints = value;
  //   });

  //   AllAirportsStore.subscribe((value) => {
  //     airports = value;
  //   });

  //   AllAirspacesStore.subscribe((value) => {
  //     airspaces = value;
  //   });

  //   async function loadSeededRoute() {
  //     // AwaitingServerResponseStore.set(true);
  //     const routeData = await generateFRTOLRouteFromSeed(
  //       routeSeed,
  //       airports,
  //       airspaces,
  //       maxFL,
  //     );
  //     if (routeData) loadRouteData(routeData);
  //     // AwaitingServerResponseStore.set(false);
  //   }

  const dragDuration: number = 200;
  let draggingWaypoint: Waypoint | undefined = undefined;
  let animatingWaypoints = new Set();

  function swapWith(waypoint: Waypoint): void {
    if (draggingWaypoint === waypoint || animatingWaypoints.has(waypoint))
      return;
    animatingWaypoints.add(waypoint);
    setTimeout(
      (): boolean => animatingWaypoints.delete(waypoint),
      dragDuration,
    );
    const cardAIndex = waypoints.indexOf(draggingWaypoint);
    const cardBIndex = waypoints.indexOf(waypoint);
    waypoints[cardAIndex] = waypoint;
    waypoints[cardBIndex] = draggingWaypoint;
    waypoints.forEach((waypoint, index) => {
      waypoint.index = index;
    });
    // WaypointsStore.set(waypoints);
  }

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <Link href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {sidebarSections.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveSection(item.title);
                        // Naive solution to update the url - need a function to update the url
                        // So that if sidebar is already defined it doesnt do something funny
                        router.push(`?sidebar=${item.title}`);
                        setOpen(true);
                      }}
                      isActive={activeSection === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>{/* <NavUser user={data.user} /> */}</SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {sidebarSections.find((x) => x.title == activeSection)?.title}
            </div>
            <Button
              variant={"link"}
              onClick={() => {
                setOpen(false);
                // Naive solution - make a helper function please!
                router.replace("/plan");
              }}
            >
              <MdOutlineKeyboardDoubleArrowLeft />
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              <div className="flex flex-col gap-2 px-2">
                {activeSection == "Route Waypoints" &&
                  waypoints.length == 0 && (
                    <div className="px-1">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Add a waypoint by clicking on an airport or any other
                        spot on the map. Or use the <b>Auto-generate</b> tool.
                      </p>
                    </div>
                  )}

                {activeSection == "Route Waypoints" &&
                  waypoints.map((waypoint) => {
                    return (
                      <div
                        className="card flex flex-row place-content-center gap-2 p-2"
                        draggable="true"
                        //   animate:flip={{ duration: dragDuration }}
                        //   on:dragstart={() => {
                        //     draggingWaypoint = waypoint;
                        //   }}
                        //   on:dragend={() => {
                        //     draggingWaypoint = undefined;
                        //   }}
                        //   on:dragenter={() => {
                        //     swapWith(waypoint);
                        //   }}
                        //   on:dragover={(e) => {
                        //     e.preventDefault();
                        //   }}
                      >
                        <div className="flex flex-col place-content-center">
                          {waypoint.index == 0 && <span>🛩️</span>}
                          {waypoint.index == waypoints.length - 1 && (
                            <span>🏁</span>
                          )}
                          {waypoint.index != 0 &&
                            waypoint.index != waypoints.length - 1 && (
                              <span>🚩</span>
                            )}
                        </div>
                        <div className="flex flex-col place-content-center">
                          <Textarea placeholder={waypoint.name} />
                        </div>
                        <button
                          className="flex flex-col place-content-center"
                          //   use:popup={{
                          //     event: "click",
                          //     target: waypoint.name + "-waypoint-details-popup",
                          //     placement: "bottom",
                          //   }}
                        >
                          <MdOutlineMoreHoriz />
                        </button>

                        <div
                          id={`${waypoint.name}-waypoint-details-popup`}
                          className="card z-50 w-auto p-4 shadow-xl"
                          data-popup={`${waypoint.name}-waypoint-details-popup`}
                        >
                          <div>
                            <button
                              onClick={() => {
                                WaypointsStore.update((waypoints) => {
                                  waypoints = waypoints.filter(
                                    (w) => w.id !== waypoint.id,
                                  );
                                  waypoints.forEach((waypoint, index) => {
                                    waypoint.index = index;
                                  });
                                  return waypoints;
                                });
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {activeSection == "Scenario Settings" && (
                  <div className="flex flex-col gap-2 p-2">
                    <div className="flex flex-col gap-1">
                      <div className="label text-sm">Scenario Seed</div>
                      <div className="flex flex-row gap-2">
                        <Input
                          id="scenario-seed-input"
                          placeholder="Enter a seed"
                          defaultValue={scenarioSeed}
                          onChange={(e) => {
                            scenarioSeed = e.target.value;
                          }}
                        />
                        <Button
                          type="button"
                          className="btn variant-filled w-10"
                          onClick={() => {
                            if (awaitingServerResponse) return;

                            scenarioSeed = randomString(6);

                            const element = document.getElementById(
                              "scenario-seed-input",
                            );
                            if (element) {
                              element.value = scenarioSeed;
                            }
                          }}
                        >
                          <MdOutlineRefresh />
                        </Button>
                      </div>
                    </div>

                    <label className="flex items-center space-x-2">
                      <Checkbox
                        id="emergency-events-checkbox"
                        checked
                        onCheckedChange={() =>
                          (hasEmergencyEvents = !hasEmergencyEvents)
                        }
                      />
                      <p>Emergency Events</p>
                    </label>
                  </div>
                )}

                {activeSection == "Preferences" && (
                  <div className="flex flex-col gap-3 p-2">
                    <div className="flex flex-col gap-2">
                      <div>
                        <Label>Distance Unit</Label>
                      </div>
                      <Select onValueChange={(value) => (distanceUnit = value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue
                            defaultValue={"nm"}
                            placeholder={"Nautical Miles"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nm">Nautical Miles</SelectItem>
                          <SelectItem value="mi">Miles</SelectItem>
                          <SelectItem value="km">Kilometers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Maximum Flight Level</Label>
                      <Input
                        id="fl-input"
                        defaultValue={maxFL}
                        onChange={(e) => {
                          maxFL = parseInt(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                )}

                {activeSection == "Generate" && (
                  <div className="flex flex-col gap-2 p-2">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger>
                          <MdAutoAwesome /> Auto-generate Route
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-2">
                            <div className="label">Route Seed</div>
                            <div className="flex flex-row gap-2">
                              <Input
                                id="route-seed-input"
                                placeholder="Enter a seed"
                                defaultValue={routeSeed}
                                onChange={(e) => {
                                  routeSeed = e.target.value;
                                }}
                              />
                              <button
                                type="button"
                                className="btn variant-filled w-10"
                                onClick={() => {
                                  if (awaitingServerResponse) return;

                                  routeSeed = randomString(6);

                                  const element =
                                    document.getElementById("route-seed-input");
                                  if (element) {
                                    element.value = routeSeed;
                                  }
                                }}
                              >
                                <MdOutlineRefresh />
                              </button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
