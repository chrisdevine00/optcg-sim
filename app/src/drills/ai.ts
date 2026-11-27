/**
 * Everything the drills take from `@optcg/ai/drills` at run time (the `@optcg/ai` barrel holds only their types), behind one dynamic import (`loadDrillAi`, load.ts).
 * The banks are JSON (about 300 KB raw in all): importing them from the drill screens' static
 * graph would put them in the Game chunk (and the start-up chunk through the ai barrel), so only a
 * drill route loads this module, after it has mounted. `bankFor` is deliberately not used here: it
 * would pull all three bank files into the shared ai chunk. `banks.ts` imports each file on its own.
 */
export { certaintyLabel } from '@optcg/ai';
export {
  explainCounter,
  harderHandHeader,
  explainDon,
  explainMulliganItem,
  judgeCounter,
  judgeDonLine,
  judgeMulligan,
  lethalHeaderOf,
  lethalVerdictOf,
  metaListSets,
  mulliganCoverage,
  mulliganItemFromFlag,
  mulliganLabel,
  recordOfItem,
} from '@optcg/ai/drills';
