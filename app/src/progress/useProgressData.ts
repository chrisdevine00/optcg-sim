/**
 * Loads what the Progress and Learn pages derive from (M9 WP6): saved games with their reviews, the
 * progress document, the tutorial credit and the lethal log. Everything is read from the browser's own
 * stores; a store that fails reads as empty, so a page always renders. `reload` re-reads (after "Mark
 * as read", for one).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { readLethalProgress } from '../play/coach/profile.ts';
import { getStore } from '../store/index.ts';
import { settleStore } from '../store/open.ts';
import type { StoredReview } from '../store/types.ts';
import { lessonCredit } from '../tutorial/progress.ts';
import type { DeriveInput, LethalEntry } from './derive.ts';
import { appProgress, emptyProgress } from './store.ts';

export interface ProgressData {
  input: DeriveInput;
  lethal: LethalEntry[];
  /** False until the first read finishes. */
  ready: boolean;
  reload: () => void;
}

const EMPTY: DeriveInput = {
  games: [],
  reviews: new Map(),
  progress: emptyProgress(),
  credit: null,
};

export function useProgressData(): ProgressData {
  const [state, setState] = useState<{ input: DeriveInput; lethal: LethalEntry[] } | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    void (async () => {
      let games: DeriveInput['games'];
      const reviews = new Map<string, StoredReview>();
      try {
        await settleStore();
        const store = getStore();
        games = await store.listGames();
        for (const g of games) {
          try {
            const r = await store.getReview(g.id);
            if (r) reviews.set(g.id, r);
          } catch {
            /* a review that cannot be read counts as not reviewed */
          }
        }
      } catch {
        games = [];
      }
      const progress = await appProgress()
        .get()
        .catch(() => emptyProgress());
      const credit = ((): DeriveInput['credit'] => {
        try {
          return lessonCredit();
        } catch {
          return null;
        }
      })();
      if (alive)
        setState({ input: { games, reviews, progress, credit }, lethal: readLethalProgress() });
    })();
    return () => {
      alive = false;
    };
  }, [tick]);
  return useMemo(
    () => ({
      input: state?.input ?? EMPTY,
      lethal: state?.lethal ?? [],
      ready: state !== null,
      reload,
    }),
    [state, reload],
  );
}
