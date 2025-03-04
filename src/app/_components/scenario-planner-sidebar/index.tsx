"use client";

import {
  MdAirplanemodeActive,
  MdLocationPin,
  MdOutlineKeyboardDoubleArrowLeft,
} from "react-icons/md";
import { IoOptions } from "react-icons/io5";
import { PiPolygonBold } from "react-icons/pi";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import AircraftSection from "./aircraft-section";
import RouteSection from "./route-section";
import ScenarioSettingsSection from "./scenario-settings-section";
import AirspacesSection from "./airspaces-section";

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
    icon: IoOptions,
  },
  {
    title: "Aircraft Details",
    description: "Set Callsign, Aircraft Type, and other details",
    icon: MdAirplanemodeActive,
  },
  {
    title: "Airspaces",
    description: "Show and hide airspaces based on parameters",
    icon: PiPolygonBold,
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
    if (sidebarSection || activeSection) {
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
  }, [sidebarSection, setOpen, activeSection]);

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
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
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
                // Naive solution - make a helper function please! (currently deletes all state held in url params)
                router.replace("/plan");
              }}
            >
              <MdOutlineKeyboardDoubleArrowLeft />
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent className="h-full">
          <SidebarGroup className="h-full px-0">
            <SidebarGroupContent className="h-full">
              <div className="flex h-full flex-col gap-2 px-2">
                {activeSection == "Route Waypoints" && <RouteSection />}

                {activeSection == "Scenario Settings" && (
                  <ScenarioSettingsSection />
                )}

                {activeSection == "Aircraft Details" && <AircraftSection />}

                {activeSection == "Airspaces" && <AirspacesSection />}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
