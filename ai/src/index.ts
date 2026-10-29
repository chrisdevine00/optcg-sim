/** Opponent and analysis. Runs inside a Web Worker (see worker.ts); this entry is also usable directly. */
export { AI_TIERS, type AiTier } from './tiers.ts';
export { rookie, attackIsLethal, type Decided, type RookieContext } from './rookie.ts';
export { chooseAction } from './choose.ts';
export { minimal, type Explanation, type Evidence, type Move } from './explanation.ts';
export type { AiRequest, AiResponse } from './protocol.ts';
