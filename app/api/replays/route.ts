import { getReplaySourcesForApi } from "@/lib/replay-discovery";
import { readBracketResults } from "@/lib/bracket-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const sources = getReplaySourcesForApi();
  const bracket = readBracketResults();

  return Response.json(
    { sources, bracket },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
