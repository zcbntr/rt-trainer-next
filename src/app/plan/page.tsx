import RoutePlannerMap from "../_components/maps/route-planner";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { ScenarioPlannerSidebar } from "../_components/scenario-planner-sidebar";
import ScenarioPlannerFooter from "../_components/scenario-planner-footer";

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <ScenarioPlannerSidebar />
      <SidebarInset>
        <div className="flex h-full w-full flex-col place-content-center">
          <div className="flex h-full w-full flex-col place-content-center sm:place-content-start">
            <div className="xs:pr-3 flex h-full min-h-96 w-full min-w-96 flex-col">
              <RoutePlannerMap className="h-full w-full" />
            </div>
            <ScenarioPlannerFooter />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
