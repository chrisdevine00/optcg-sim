/**
 * Everything the drills take from `@optcg/ai` at run time, behind one dynamic import (`loadDrillAi`, load.ts).
 * The banks are JSON (about 300 KB raw in all): importing them from the drill screens' static
 * graph would put them in the Game chunk (and the start-up chunk through the ai barrel), so only a
 * drill route loads this module, after it has mounted. Rollup then keeps the bank files and the
 * bank-reading functions of `ai/src/search/drills` in this module's own chunk.
 */
export {
  bankFor,
  explainCounter,
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
  provideMulliganCards,
  recordOfItem,
} from '@optcg/ai';
