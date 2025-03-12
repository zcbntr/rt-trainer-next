/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import TopNav from "~/app/_components/topnav";
import Footer from "~/app/_components/footer";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session?.user.email) {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <TopNav />
      <div className="m-auto p-4">
        <h1 className="text-3xl">My Scenarios</h1>
        <p>Coming soon...</p>
      </div>
      <Footer />
    </HydrateClient>
  );
}
