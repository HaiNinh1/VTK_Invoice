import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { ApiError } from '../lib/api/errors';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Never retry auth/validation/forbidden errors.
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
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
