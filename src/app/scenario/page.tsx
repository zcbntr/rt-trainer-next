import Link from "next/link";
import Simulator from "~/app/_components/sim/simulator";
import { HydrateClient } from "~/trpc/server";

export default async function Page() {
  return (
    <HydrateClient>
      <div className="container mx-auto">
        <Link href="/">Back</Link>
        <Simulator />
      </div>
    </HydrateClient>
  );
}
