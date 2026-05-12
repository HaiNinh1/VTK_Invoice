import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

/**
 * Shared singleton QueryClient.
 *
 * Exported so that non-React code (auth flows, logout handlers, deep-link
 * handlers) can imperatively invalidate or clear the cache without going
 * through a React hook.
 *
 * Defaults align with the previous in-component config in QueryProvider:
 *  - 30s stale time, 5min gc, no refetch-on-focus.
 *  - Never retry on 401/403/422/signature-required.
 *  - Single retry otherwise. Mutations never retry.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (
            error.isUnauthorized() ||
            error.isForbidden() ||
            error.isValidation() ||
            error.isSignatureRequired()
          ) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
