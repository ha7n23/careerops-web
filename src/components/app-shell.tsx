"use client";

import {
  BriefcaseBusiness,
  Database,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/",
    icon: LayoutDashboard,
    label: "Overview",
  },
  {
    href: "/applications",
    icon: BriefcaseBusiness,
    label: "Applications",
  },
  {
    href: "/evidence",
    icon: Database,
    label: "Evidence",
  },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--shell-glow),transparent_34rem)] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground focus-visible:ring-ring fixed top-3 left-3 z-50 -translate-y-20 rounded-lg px-4 py-2 text-sm font-medium shadow-lg outline-none focus-visible:translate-y-0 focus-visible:ring-3"
      >
        Skip to content
      </a>

      <aside className="border-sidebar-border bg-sidebar/95 hidden border-r backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Brand />

        <nav aria-label="Primary navigation" className="flex-1 px-4 py-6">
          <p className="text-muted-foreground px-3 text-[0.68rem] font-semibold tracking-[0.16em] uppercase">
            Workspace
          </p>

          <ul className="mt-3 space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = matchesPath(pathname, item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="m-4 rounded-2xl border bg-white/70 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck aria-hidden="true" className="text-primary size-4" />
            Evidence grounded
          </div>
          <p className="text-muted-foreground mt-2 text-xs leading-5">
            CareerOps keeps generated claims tied to evidence you approve.
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-border/80 bg-background/90 sticky top-0 z-40 border-b backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center px-5">
            <Brand compact />
          </div>

          <nav
            aria-label="Primary navigation"
            className="scrollbar-none overflow-x-auto px-3 pb-3"
          >
            <ul className="flex min-w-max gap-1">
              {navigationItems.map((item) => {
                const isActive = matchesPath(pathname, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "focus-visible:ring-ring/50 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <div id="main-content">{children}</div>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="CareerOps overview"
      className={cn(
        "focus-visible:ring-ring/50 flex items-center gap-3 rounded-xl outline-none focus-visible:ring-3",
        compact ? "w-fit" : "border-sidebar-border border-b px-6 py-6",
      )}
    >
      <span className="from-primary to-primary/70 text-primary-foreground flex size-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm">
        <Sparkles aria-hidden="true" className="size-4" />
      </span>

      <span>
        <span className="block text-sm font-semibold tracking-tight">
          CareerOps
        </span>
        <span className="text-muted-foreground block text-[0.68rem]">
          AI application workspace
        </span>
      </span>
    </Link>
  );
}

function matchesPath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
