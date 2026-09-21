import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationAnalysisPanel } from "@/features/applications/application-analysis-panel";
import { ApplicationDetailPanel } from "@/features/applications/application-detail-panel";
import { applicationIdSchema } from "@/features/applications/contracts";

type ApplicationPageProps = {
  params: Promise<{ applicationId: string }>;
};

export default async function ApplicationPage({
  params,
}: ApplicationPageProps) {
  const { applicationId: applicationIdValue } = await params;
  const parsedApplicationId = applicationIdSchema.safeParse(applicationIdValue);

  if (!parsedApplicationId.success) {
    notFound();
  }

  return (
    <main className="bg-muted/30 min-h-screen">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:px-8 lg:py-16">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex w-fit items-center gap-2 rounded-md text-sm transition-colors outline-none focus-visible:ring-3"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to applications
        </Link>

        <ApplicationDetailPanel applicationId={parsedApplicationId.data} />
        <ApplicationAnalysisPanel applicationId={parsedApplicationId.data} />
      </div>
    </main>
  );
}
