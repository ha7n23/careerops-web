import "server-only";

import { createOpenClawClient } from "@/integrations/openclaw/server-client";

export function sendOpenClawAssistantMessage(input: {
  conversationId: string;
  message: string;
}) {
  return createOpenClawClient().sendMessage(input);
}
