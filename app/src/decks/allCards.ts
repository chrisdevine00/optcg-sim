/** Every card, for the deck builder (all sets load as lazy chunks; ARCHITECTURE §5 bundle budget). */
import { useEffect, useState } from 'react';
import type { Card } from '@optcg/cards';
import { loadSet, manifest } from '@optcg/cards/browser';

let all: Promise<Map<string, Card>> | null = null;

export function loadAllCards(): Promise<Map<string, Card>> {
  all ??= Promise.all(manifest.sets.map((s) => loadSet(s.code))).then((files) => {
    const m = new Map<string, Card>();
    for (const f of files) for (const c of f.cards) m.set(c.id, c);
    return m;
  });
  all.catch(() => {
    all = null;
  });
  return all;
}

export function useAllCards(): { cards: Map<string, Card> | null; error: string | null } {
  const [cards, setCards] = useState<Map<string, Card> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadAllCards().then(
      (m) => live && setCards(m),
      (e: unknown) => live && setError(String(e)),
    );
    return () => {
      live = false;
    };
  }, []);
  return { cards, error };
}
