/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import Home from "~/app/_components/homepage";
import Dashboard from "./_components/dashboard";

export default async function Page() {
  const session = await auth();

  if (!session?.user.email) {
    return (
      <HydrateClient>
        <Home />
      </HydrateClient>
    );
  }

  return (
    <HydrateClient>
      <Dashboard />
    </HydrateClient>
  );
}
