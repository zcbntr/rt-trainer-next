/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import TopNav from "~/app/_components/topnav";
import Footer from "~/app/_components/footer";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session?.user.email) {
    redirect("/");
  }

  const scenarios = await api.scenario.getOwnedScenarios();

  const scenarioList = scenarios.map((scenario) => (
    <div key={scenario.id}>
      <h2>{scenario.name}</h2>
      <p>{scenario.description}</p>
    </div>
  ));

  return (
    <HydrateClient>
      <TopNav />
      <div className="m-auto p-4">
        <h1 className="text-3xl">My Scenarios</h1>
        {scenarioList}
      </div>
      <Footer />
    </HydrateClient>
  );
}
