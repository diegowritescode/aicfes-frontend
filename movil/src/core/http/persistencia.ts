import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { QueryClient } from '@tanstack/react-query';
import { debePersistir, estaVencido } from '@/core/almacenamiento/model/persistencia';

/**
 * The query cache, kept across app launches.
 *
 * Without this the app is blank with no connection: the cache lives in
 * memory and dies when the process does. On a prepaid line with 8.2 GB
 * a month — the median in Colombia — that is the difference between a
 * useful app and one that gets uninstalled.
 *
 * What is written and for how long is decided in
 * `core/almacenamiento/model/persistencia.ts`, where it can be tested.
 * This file is the plumbing.
 */

const CLAVE = 'aicfes.consultas';

/* Older stored caches are discarded rather than migrated. A shape that
   changed between versions is cheaper to refetch than to reason about,
   and the learner loses one load, not their session. */
const VERSION = 'v1';

export const persistidor = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: `${CLAVE}.${VERSION}`,
  /* Writes are batched: the cache changes on every fetch, and writing
     on each one would mean a disk write per request. */
  throttleTime: 2_000,
});

export const opcionesDePersistencia = {
  persister: persistidor,
  /* The age check is per key rather than one number for everything,
     because a stale dashboard is yesterday's news and a stale "question
     of the day" is a lie. `maxAge` here is the outer bound; the real
     decision is in `shouldDehydrateQuery`. */
  maxAge: 90 * 24 * 60 * 60 * 1000,
  dehydrateOptions: {
    shouldDehydrateQuery: (consulta: { queryKey: readonly unknown[]; state: { status: string; dataUpdatedAt: number } }) => {
      /* A failed query must not be written. Persisting an error means
         the next cold start shows a failure the learner cannot retry
         away, for a request that was never made again. */
      if (consulta.state.status !== 'success') return false;
      if (!debePersistir(consulta.queryKey)) return false;
      return !estaVencido(consulta.queryKey, consulta.state.dataUpdatedAt);
    },
  },
} as const;

/**
 * Forget everything written to disk.
 *
 * Called on sign-out: the cache holds one learner's dashboard, and the
 * next person to open the app on a shared phone must not see it. This
 * is why sign-out cannot simply drop the in-memory cache any more.
 */
export async function olvidarPersistido(cliente?: QueryClient): Promise<void> {
  try {
    await persistidor.removeClient();
  } catch {
    /* A store that will not clear is not a reason to block sign-out.
       The session itself is gone either way, so the stale cache is
       unreadable data rather than a leak of access. */
  }
  cliente?.clear();
}
