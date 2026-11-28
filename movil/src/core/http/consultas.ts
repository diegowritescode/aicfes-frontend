import { QueryClient } from '@tanstack/react-query';

/**
 * Server state lives here, not in useState.
 *
 * This is what removes the ten useEffect from the web app's Test.tsx
 * and the seven from Results.tsx: loading, error, retry, caching and
 * invalidation stop being written by hand on every screen.
 *
 * The defaults are set for a phone on mobile data:
 *
 *  - Two retries, not three. A learner on one bar notices the wait
 *    more than they notice a failure they can tap through.
 *  - No retry on a typed failure. Our client turns an expired session
 *    into a result rather than a throw, so a failed query is a real
 *    answer and retrying it only burns time.
 *  - Refetch when the app comes back to the foreground. A phone spends
 *    most of its life in a pocket, and the first thing a learner sees
 *    on return should not be a stale screen.
 */
export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        retryDelay: (intento) => Math.min(1000 * 2 ** intento, 8000),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: { retry: 0 },
    },
  });
}
