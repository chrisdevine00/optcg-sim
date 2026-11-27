/**
 * The committed banks, one dynamic import each, so a drill route loads only its own JSON and the
 * Game chunk and the start-up chunk never carry them (bundle sizes are in the WP4 report).
 * The mulligan bank is committed like the others (M9-R11): its hands and the lists they came from.
 */
import type { Card } from '@optcg/cards';
import type { DrillBank, DrillId, DrillItem } from './types.ts';
import type { DrillAi } from './load.ts';

const committed = async (drill: DrillId): Promise<DrillBank> =>
  (
    await (drill === 'lethal'
      ? import('./banks/lethal.json')
      : drill === 'counter'
        ? import('./banks/counter.json')
        : drill === 'don'
          ? import('./banks/don.json')
          : import('./banks/mulligan.json'))
  ).default as unknown as DrillBank;

export async function loadBank(
  drill: DrillId,
  _ai?: Pick<DrillAi, never>,
  _cards?: ReadonlyMap<string, Card>,
): Promise<DrillItem[]> {
  return (await committed(drill)).items;
}
