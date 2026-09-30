import { NextResponse } from "next/server";

import { ASSISTANT_SESSION_COOKIE } from "@/features/assistant/session";

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json(
    { status: "reset" },
    { headers: { "Cache-Control": "private, no-store" } },
  );

  response.cookies.set(ASSISTANT_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
