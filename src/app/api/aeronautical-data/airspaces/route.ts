import { getAllValidAirspaceData } from "~/lib/route-gen/openaip-handler";

export const dynamic = "force-static";

export async function GET() {
  const data = await getAllValidAirspaceData();

  return Response.json({ data });
}
