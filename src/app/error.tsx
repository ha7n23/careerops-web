"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-3xl px-5 py-16 sm:px-8 lg:px-10">
        <section
          role="alert"
          className="border-destructive/20 bg-card w-full rounded-3xl border p-7 shadow-sm sm:p-9"
        >
          <div className="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-2xl">
            <CircleAlert aria-hidden="true" className="size-5" />
          </div>

          <p className="text-destructive mt-6 text-sm font-medium">
            Workspace interrupted
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            CareerOps could not display this page
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6">
            Your saved evidence and applications have not been changed. Retry
            the page, or return to the overview if the problem continues.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={retry}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Return to overview</Link>
            </Button>
          </div>

          {error.digest !== undefined && (
            <p className="text-muted-foreground mt-6 font-mono text-xs">
              Reference: {error.digest}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
