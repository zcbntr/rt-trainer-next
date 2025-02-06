/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Link from "next/link";
import Image from "next/image";
import planeGraphic from "~/../public/images/planeGraphic.svg";

import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center ">
        <div className="container mx-auto max-w-screen-lg p-5 tracking-wide">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            <div className="space-y-4 p-4 md:col-span-6">
              <h1 className="text-3xl font-bold leading-10 md:text-5xl">
                RT Trainer - A{" "}
                <span className="x-1 bg-surface-300-600-token relative inset-y-1 px-1 transition-transform duration-300 ease-in-out hover:rotate-3 hover:scale-110 md:px-3">
                  responsive
                </span>{" "}
                FRTOL practice tool
              </h1>
              <p className="max-w-xl opacity-60">
                Gain confidence in your radio telephony skills by practicing
                with our RT trainer directly in your browser.
              </p>
              <ul className="list-items">
                <li>
                  <span className="btn-icon bg-surface-300-600-token shrink-0 py-0">
                    ✔️
                  </span>
                  <span>
                    <b>Supports voice input</b> – speak your radio calls out
                    loud, just like in real life
                  </span>
                </li>
                <li>
                  <span className="btn-icon bg-surface-300-600-token shrink-0">
                    ✔️
                  </span>
                  <span>
                    <b>Generate practice scenarios</b> – routes are generated
                    randomly, no more repetition
                  </span>
                </li>
                <li>
                  <span className="btn-icon bg-surface-300-600-token shrink-0">
                    ✔️
                  </span>
                  <span>
                    <b>Get instant feedback</b> – see how well you did and where
                    you can improve
                  </span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/simulator/?tutorial=true"
                  className="btn md:btn-lg variant-filled-primary w-full md:w-fit"
                >
                  Quick route
                </Link>
                <Link
                  href="/scenario-planner"
                  className="btn md:btn-lg variant-filled-surface w-full md:w-fit"
                >
                  Create a scenario
                </Link>
              </div>
            </div>

            <Image priority src={planeGraphic} className="max-w-[500px] max-h-[500px] my-2 p-2 sm:col-span-6" width={500} height={500} alt="Plane drawing" unoptimized/>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
