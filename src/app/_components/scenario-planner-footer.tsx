"use client";

import { MdSave } from "react-icons/md";
import useRoutePlannerStore from "../stores/route-store";
import { getRouteIssues, kmToUnit } from "~/lib/sim-utils/route";
import { Button } from "~/components/ui/button";
import { type Waypoint } from "~/lib/types/waypoint";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useMemo } from "react";
import {
  scenarioFormSchema,
  type ScenarioFormSchema,
} from "../validation/create-scenario";
import { submitForm } from "~/server/api/actions/scenarios";

const ScenarioPlannerFooter = () => {
  const router = useRouter();

  const waypoints: Waypoint[] = useRoutePlannerStore(
    (state) => state.waypoints,
  );
  const airportsOnRoute = useRoutePlannerStore(
    (state) => state.airportsOnRoute,
  );
  const distance: number = useRoutePlannerStore((state) => state.distanceKM);
  const distanceUnit: string = useRoutePlannerStore(
    (state) => state.distanceDisplayUnit,
  );
  const airspacesOnRoute = useRoutePlannerStore(
    (state) => state.airspacesOnRoute,
  );

  const displayDistance = kmToUnit(distance, distanceUnit).toFixed(2);

  const form = useForm<z.infer<typeof scenarioFormSchema>>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      name: "",
    },
  });

  useMemo(() => {
    const firstWaypoint = waypoints[0];
    const lastWaypoint = waypoints[waypoints.length - 1];
    if (!firstWaypoint || !lastWaypoint) {
      return "";
    }

    const name = `${firstWaypoint?.name} to ${lastWaypoint?.name}`.substring(
      0,
      50,
    );

    form.setValue("name", name);

    return name;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypoints]);

  const onSubmit: SubmitHandler<ScenarioFormSchema> = async (data) => {
    // call the server action
    const airportIds = airportsOnRoute.map((airport) => airport._id);
    const airspaceIds = airspacesOnRoute.map((airspace) => airspace._id);

    const { data: success, errors } = await submitForm(
      data,
      airportIds,
      airspaceIds,
      waypoints,
    );

    if (errors) {
      if (Array.isArray(errors)) {
        errors.forEach((error) => {
          form.setError("name", {
            message: error.message,
          });
        });
      } else {
        form.setError("name", {
          message: errors.message,
        });
      }

      return;
    }

    if (success) {
      router.push("/my-scenarios");
    }
  };

  const routeIssues: JSX.Element[] = useMemo(() => {
    // Check if the route doesn't have any glaring issues e.g. <2 waypoints, no airports, etc.
    // If it does, show a toast and return
    // Otherwise, start the scenario by navigating to the scenario page with the route data in the URL

    const issues: string[] = getRouteIssues(
      waypoints,
      airspacesOnRoute,
      airportsOnRoute,
    );

    return issues.map((issue, index) => {
      return (
        <li className="text-red-500" key={index}>
          {issue}
        </li>
      );
    });
  }, [waypoints, airspacesOnRoute, airportsOnRoute]);

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
          <div className="text-xl">{airspacesOnRoute.length}</div>
        </div>
      </div>
      <div className="vr border-surface-200 dark:border-surface-700 h-full border" />
      <div className="flex flex-row place-content-center p-4">
        <div className="flex flex-col place-content-center">
          <div className="text-sm">Est. Scenario Duration</div>
          <div className="text-xl">0 mins</div>
        </div>
      </div>

      <div className="flex grow flex-row place-content-end gap-3 p-3">
        <div className="flex flex-col place-content-center">
          <Dialog>
            <DialogTrigger>
              <div className="flex flex-row items-center gap-2 rounded-md border-2 border-black p-2">
                <MdSave size="2em" />
                <span>Save</span>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Scenario</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="From A to B" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be shown to other users if the scenario is
                          public.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {routeIssues.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-red-500">
                        There were some issues that may cause errors in the
                        simulator. You can proceed but it is recommended to fix
                        these issues before saving:
                      </div>
                      <ul className="ml-4 list-disc text-sm">{routeIssues}</ul>
                    </div>
                  )}

                  <Button type="submit">Save</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPlannerFooter;
