import { bank as counter } from './bank-counter.ts';
import { bank as don } from './bank-don.ts';
import { bank as lethal } from './bank-lethal.ts';
import { bank as mulligan } from './bank-mulligan.ts';
import type { DrillBank, DrillId } from './types.ts';

export * from './types.ts';

// M9 WP4: the judges, answer text and seams the drill shell calls (named, so the two
// `INERT_LIFE`s and the generic `Line` of the generators do not collide in the ai barrel).
export { provideMulliganCards } from './bank-mulligan.ts';
export { judgeLethal, lethalHeader, type LethalSubmission, type LethalVerdict } from './lethal.ts';
export {
  explainMulliganItem,
  judgeMulligan,
  metaListSets,
  mulliganCoverage,
  mulliganLabel,
} from './mulligan.ts';
export { explainCounter, judgeCounter, type CounterChoice } from './counter.ts';
export { explainDon, judgeDonLine } from './don.ts';
export { describeLine } from './lines.ts';
export {
  lethalHeaderOf,
  lethalVerdictOf,
  mulliganItemFromFlag,
  publicResultOf,
  recordOfItem,
  type ItemRecord,
} from './item-seam.ts';
export type { ListSet } from './positions.ts';

const BANKS: Record<DrillId, () => DrillBank> = { mulligan, lethal, counter, don };

/**
 * The committed bank of a drill. WP0 ships empty stubs (`bank-<drill>.ts`); WP2 fills lethal and WP3
 * mulligan, counter and don, each in its own file, so this module never changes again.
 */
export const bankFor = (drill: DrillId): DrillBank => BANKS[drill]();
