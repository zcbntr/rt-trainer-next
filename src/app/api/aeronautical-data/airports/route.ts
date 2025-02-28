import { getAllValidAirportData } from "~/lib/route-gen/openaip-handler";

export const dynamic = "force-static";

export async function GET() {
  const data = await getAllValidAirportData();

  return Response.json({ data });
}
