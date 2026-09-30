import type { Metadata } from "next";

import { AssistantWorkspace } from "@/features/assistant/assistant-workspace";

export const metadata: Metadata = {
  title: "Assistant",
};

export default function AssistantPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="max-w-3xl">
          <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
            OpenClaw workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            CareerOps assistant
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            Work conversationally with your approved evidence, applications and
            pending decisions while CareerOps keeps every action inside its
            governed tool boundary.
          </p>
        </header>

        <AssistantWorkspace />
      </div>
    </main>
  );
}
