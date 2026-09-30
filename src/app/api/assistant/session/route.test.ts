import { describe, expect, it } from "vitest";

import { DELETE } from "@/app/api/assistant/session/route";

describe("DELETE /api/assistant/session", () => {
  it("expires the opaque assistant session cookie", async () => {
    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("set-cookie")).toContain(
      "careerops_assistant_session=",
    );
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
