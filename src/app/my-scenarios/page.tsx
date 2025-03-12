/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import TopNav from "~/app/_components/topnav";
import Footer from "~/app/_components/footer";
import { redirect } from "next/navigation";
import StaticPreviewMap from "../_components/maps/static-preview";

export default async function Page() {
  const session = await auth();

  if (!session?.user.email) {
    redirect("/");
  }

  const scenarios = await api.scenario.getOwnedScenariosWithWaypoints();

  const scenarioList = scenarios.map((scenario) => (
    <div key={scenario.id} className="my-2 rounded-md border p-4">
      <p className="text-xl">{scenario.name}</p>
      <p>{scenario.description}</p>
      <StaticPreviewMap
        waypoints={scenario.waypoints.map((waypoint) => {
          return {
            index: waypoint.order,
            location: [waypoint.lon, waypoint.lat],
          };
        })}
        width={400}
        height={300}
      />
    </div>
  ));

  return (
    <HydrateClient>
      <TopNav />
      <div className="m-auto p-4">
        <h1 className="text-3xl">My Scenarios</h1>
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
          {scenarioList}
        </div>
      </div>
      <Footer />
    </HydrateClient>
  );
}
