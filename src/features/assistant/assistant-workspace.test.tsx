import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resetSessionMock, sendMessageMock } = vi.hoisted(() => ({
  resetSessionMock: vi.fn(),
  sendMessageMock: vi.fn(),
}));

vi.mock("@/features/assistant/browser-api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/assistant/browser-api")
  >("@/features/assistant/browser-api");

  return {
    ...actual,
    resetAssistantSession: resetSessionMock,
    sendAssistantMessage: sendMessageMock,
  };
});

import { AssistantWorkspace } from "@/features/assistant/assistant-workspace";
import { AssistantApiError } from "@/features/assistant/browser-api";

describe("AssistantWorkspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetSessionMock.mockReset();
    sendMessageMock.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("sends a suggested prompt and renders plain assistant text", async () => {
    const user = userEvent.setup();
    sendMessageMock.mockResolvedValue({
      message: {
        id: "chatcmpl-001",
        role: "assistant",
        content: "You have one approved FastAPI claim.",
      },
    });
    render(<AssistantWorkspace />);

    await user.click(
      screen.getByRole("button", { name: "Show my approved evidence." }),
    );

    expect(sendMessageMock).toHaveBeenCalledWith("Show my approved evidence.");
    expect(
      await screen.findByText("You have one approved FastAPI claim."),
    ).toBeInTheDocument();
    expect(screen.getByText("Show my approved evidence.")).toBeInTheDocument();
  });

  it("offers a safe retry without duplicating the user message", async () => {
    const user = userEvent.setup();
    sendMessageMock
      .mockRejectedValueOnce(
        new AssistantApiError(
          "The free assistant model is busy. Try again shortly.",
          429,
          "RATE_LIMITED",
          true,
        ),
      )
      .mockResolvedValueOnce({
        message: {
          id: "chatcmpl-002",
          role: "assistant",
          content: "The retry succeeded.",
        },
      });
    render(<AssistantWorkspace />);

    await user.type(
      screen.getByLabelText("Message CareerOps assistant"),
      "Show pending actions",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await user.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText("The retry succeeded.")).toBeInTheDocument();
    expect(screen.getAllByText("Show pending actions")).toHaveLength(1);
    expect(sendMessageMock).toHaveBeenCalledTimes(2);
  });

  it("starts a new server conversation and clears the transcript", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "careerops.assistant.transcript.v1",
      JSON.stringify([
        { id: "msg-1", role: "assistant", content: "Stored response" },
      ]),
    );
    resetSessionMock.mockResolvedValue(undefined);
    render(<AssistantWorkspace />);

    expect(await screen.findByText("Stored response")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "New conversation" }));

    await waitFor(() => {
      expect(screen.queryByText("Stored response")).not.toBeInTheDocument();
    });
    expect(resetSessionMock).toHaveBeenCalledOnce();
  });
});
