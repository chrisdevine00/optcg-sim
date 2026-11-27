import { bank as counter } from './bank-counter.ts';
import { bank as don } from './bank-don.ts';
import { bank as lethal } from './bank-lethal.ts';
import { bank as mulligan } from './bank-mulligan.ts';
import type { DrillBank, DrillId } from './types.ts';

export * from './types.ts';

const BANKS: Record<DrillId, () => DrillBank> = { mulligan, lethal, counter, don };

/**
 * The committed bank of a drill. WP0 ships empty stubs (`bank-<drill>.ts`); WP2 fills lethal and WP3
 * mulligan, counter and don, each in its own file, so this module never changes again.
 */
export const bankFor = (drill: DrillId): DrillBank => BANKS[drill]();
