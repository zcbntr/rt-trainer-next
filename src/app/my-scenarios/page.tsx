/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import TopNav from "~/app/_components/topnav";
import { redirect } from "next/navigation";
import StaticPreviewMap from "../_components/maps/static-preview";
import { type WaypointType } from "~/lib/types/waypoint";
import Link from "next/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { MdEdit, MdPlayArrow } from "react-icons/md";

// Eventually add pagination and search
export default async function Page() {
  const session = await auth();

  if (!session?.user.email) {
    redirect("/");
  }

  const scenarios = await api.scenario.getOwnedScenariosWithWaypoints();

  const scenarioList = scenarios.map((scenario) => (
    <div
      key={scenario.id}
      className="my-2 flex flex-col gap-0 rounded-md border p-3"
    >
      <div className="flex flex-row md:grid md:grid-cols-7">
        <div className="flex flex-col md:col-span-5">
          <Link href={`/plan?edit=${scenario.id}`} className="text-xl">
            {scenario.name}
          </Link>
          <p className="text-muted-foreground">
            {scenario.description ?? "No description given."}
          </p>
        </div>

        <div className="col-span-2 flex flex-col place-content-center">
          <div className="flex flex-row place-content-end gap-2">
            <Link
              href={`/scenario/${scenario.id}`}
              className={buttonVariants({ variant: "outline" }) + " w-fit"}
            >
              <MdPlayArrow />
            </Link>

            <Link
              href={`/plan?edit=${scenario.id}`}
              className={buttonVariants({ variant: "outline" }) + " w-fit"}
            >
              <MdEdit />
            </Link>
          </div>
        </div>
      </div>
      <StaticPreviewMap
        className="mt-3 rounded-md border"
        waypoints={scenario.waypoints.map((waypoint) => {
          return {
            id: waypoint.id.toString(),
            name: waypoint.name,
            type: waypoint.type as WaypointType,
            index: waypoint.order,
            location: [parseFloat(waypoint.lon), parseFloat(waypoint.lat)],
          };
        })}
        width={464}
        height={300}
      />
    </div>
  ));

  return (
    <HydrateClient>
      <TopNav />
      <div className="mx-auto max-w-5xl p-4">
        <h1 className="text-3xl">My Scenarios</h1>
        <div className="flex flex-col gap-3 pt-10 md:grid md:grid-cols-2">
          {scenarioList}
        </div>

        {scenarioList.length == 0 && (
          <div className="flex flex-row place-content-center p-4">
            <div className="flex flex-col gap-2 rounded-md border p-4 text-center">
              <span className="text-xl">
                It seems like you don&apos;t have any saved scenarios.
              </span>
              <div className="flex flex-row place-content-center">
                <Link
                  href="/plan"
                  className={buttonVariants({ variant: "outline" }) + " w-fit"}
                >
                  Try making one
                </Link>
              </div>
            </div>
          </div>
        )}

        {scenarioList.length > 0 && (
          <div className="flex flex-row place-content-center p-4">
            <div className="flex flex-col gap-3 p-4 text-center">
              <span className="text-xl">
                You can create more scenarios in the scenario planner.
              </span>
              <div className="flex flex-row place-content-center">
                <Link
                  href="/plan"
                  className={
                    buttonVariants({ variant: "outline" }) + " w-fit text-lg"
                  }
                >
                  Take me there
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </HydrateClient>
  );
}
