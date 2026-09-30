import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-3xl px-5 py-16 sm:px-8 lg:px-10">
        <section className="bg-card w-full rounded-3xl border p-7 shadow-sm sm:p-9">
          <div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-2xl">
            <SearchX aria-hidden="true" className="size-5" />
          </div>
          <p className="text-primary mt-6 text-sm font-medium">Not found</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            This CareerOps page does not exist
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6">
            The link may be outdated, or the application identifier may be
            invalid. Your saved work has not been changed.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Return to overview
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
