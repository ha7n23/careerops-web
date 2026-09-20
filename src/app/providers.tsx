"use client";

import {
  environmentManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
  queryClient?: QueryClient;
};

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 60_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) {
    return createQueryClient();
  }

  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function Providers({ children, queryClient }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient ?? getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
