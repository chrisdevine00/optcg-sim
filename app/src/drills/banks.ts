/**
 * The committed banks, one dynamic import each, so a drill route loads only its own JSON and the
 * Game chunk and the start-up chunk never carry them (bundle sizes are in the WP4 report).
 * The mulligan bank is built at call time from the sourced lists and the loaded cards.
 */
import type { Card } from '@optcg/cards';
import type { DrillBank, DrillId, DrillItem } from './types.ts';
import type { DrillAi } from './load.ts';

const committed = async (drill: 'lethal' | 'counter' | 'don'): Promise<DrillBank> =>
  (
    await (drill === 'lethal'
      ? import('./banks/lethal.json')
      : drill === 'counter'
        ? import('./banks/counter.json')
        : import('./banks/don.json'))
  ).default as unknown as DrillBank;

export async function loadBank(
  drill: DrillId,
  ai: Pick<DrillAi, 'mulliganBank' | 'metaListSets'>,
  cards: ReadonlyMap<string, Card>,
): Promise<DrillItem[]> {
  if (drill === 'mulligan') return ai.mulliganBank(ai.metaListSets(), cards);
  return (await committed(drill)).items;
}
