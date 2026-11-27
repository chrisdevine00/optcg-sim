import type { Card } from '@optcg/cards';
import { ENGINE_VERSION } from '@optcg/engine';
import { metaListSets, mulliganBank } from './mulligan.ts';
import type { DrillBank } from './types.ts';

/**
 * The mulligan bank (M9 WP3). Items are built at call time from the sourced lists (`mulliganBank`),
 * which needs the card data: the app calls `provideMulliganCards` once its cards are loaded, and until
 * then `bank()` is empty. Nothing is committed: the bank is a pure function of the lists and the cards.
 */
let provided: ReadonlyMap<string, Card> | null = null;
let memo: DrillBank | null = null;

export function provideMulliganCards(cards: ReadonlyMap<string, Card>): void {
  provided = cards;
  memo = null;
}

export const bank = (): DrillBank => {
  if (!provided) return { drill: 'mulligan', builtWith: { engine: '', scripts: '' }, items: [] };
  memo ??= {
    drill: 'mulligan',
    builtWith: { engine: ENGINE_VERSION, scripts: 'runtime' },
    items: mulliganBank(metaListSets(), provided),
  };
  return memo;
};
