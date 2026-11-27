/**
 * Reports the mulligan bank (M9 WP3): `npx tsx scripts/drill-bank-mulligan.ts`.
 *
 * The mulligan bank is not committed: `mulliganBank` rebuilds it at call time from the sourced lists
 * and the card data (about 36 hands). This prints what it holds, per guide and seat, and the guides
 * that have no sourced mulligan rule (the drill's start screen says so for those). Exit 1 when the bank
 * has fewer than `MIN_BANK` items or lacks Keep or Redraw items altogether.
 */
import '../test-setup/scripts.ts';
import { mulliganBank, mulliganCoverage, metaListSets } from '../ai/src/search/drills/mulligan.ts';
import { MIN_BANK } from '../ai/src/search/drills/types.ts';
import { cardMap } from '../ai/test/support.ts';

const sets = metaListSets();
const cards = cardMap();
const items = mulliganBank(sets, cards);
for (const i of items)
  console.log(
    `${i.id}\tseed ${i.source.kind === 'bank' ? i.source.seed : '-'}\t${i.hand.join(' ')}`,
  );
const { sourced, unsourced } = mulliganCoverage(sets, cards);
console.log(`\n${items.length} items from ${sourced.length} sourced guides`);
console.log(`no sourced mulligan rule: ${unsourced.join(', ')}`);
const classes = new Set(items.map((i) => i.id.split('-').at(-1)));
process.exit(items.length >= MIN_BANK && classes.has('keep') && classes.has('redraw') ? 0 : 1);
