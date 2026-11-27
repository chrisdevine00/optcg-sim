import json from '../../../../app/src/drills/banks/mulligan.json';
import type { DrillBank } from './types.ts';

/**
 * The committed mulligan bank (M9-R11): five-card hands drawn by seed from the sourced lists, each item
 * carrying the list it came from, generated on the pinned lists by `npm run drills:bank -- mulligan` and
 * re-verified by `ai/test/drills-mulligan.test.ts`. It was built at call time from the live meta file,
 * so a weekly meta PR changed the shipped hands while CI checked the pinned ones.
 */
export const bank = (): DrillBank => json as unknown as DrillBank;
