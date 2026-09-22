import { getPendingActions } from "@/features/applications/server";

const responseHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET(): Promise<Response> {
  try {
    const result = await getPendingActions();

    return Response.json(result, { headers: responseHeaders });
  } catch (error) {
    console.error("Failed to get pending CareerOps actions.", error);

    return Response.json(
      {
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "CareerOps services are temporarily unavailable.",
        },
      },
      { status: 502, headers: responseHeaders },
    );
  }
}
