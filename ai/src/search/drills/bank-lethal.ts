import type { DrillBank } from './types.ts';
import json from '../../../../app/src/drills/banks/lethal.json';

/**
 * The committed lethal bank (M9 WP2): card ids and scenarios only, written by
 * `npm run drills:bank -- lethal` and re-verified by the solver in `ai/test/drills-lethal.test.ts`.
 */
export const bank = (): DrillBank => json as unknown as DrillBank;
