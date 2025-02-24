/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import Home from "~/app/_components/homepage";
import Dashboard from "./_components/dashboard";
import TopNav from "./_components/topnav";
import Footer from "./_components/footer";

export default async function Page() {
  const session = await auth();

  if (!session?.user.email) {
    return (
      <HydrateClient>
        <TopNav />
        <Home />
        <Footer />
      </HydrateClient>
    );
  }

  return (
    <HydrateClient>
      <TopNav />
      <Dashboard />
      <Footer />
    </HydrateClient>
  );
}
