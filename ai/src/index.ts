/** Opponent and analysis. Runs inside a Web Worker (see worker.ts); this entry is also usable directly. */
export { AI_TIERS, type AiTier } from './tiers.ts';
export { rookie, attackIsLethal, type Decided, type RookieContext } from './rookie.ts';
export { chooseAction } from './choose.ts';
export {
  minimal,
  certaintyLabel,
  type Explanation,
  type ExplanationContext,
  type Evidence,
  type Move,
} from './explanation.ts';
export type { AiRequest, AiResponse, GameInfo } from './protocol.ts';
export {
  AiSession,
  BUDGETS,
  type Budget,
  type SessionDecision,
  type SessionOptions,
} from './session.ts';
export {
  PLAYBOOKS,
  playbookFor,
  ownTurn,
  type Playbook,
  type Bias,
  type Assertion,
} from './playbook.ts';
export {
  priorFor,
  priorCardIds,
  counterValueOf,
  eventCounterOf,
  biggestCounter,
  averageCounter,
  type Prior,
} from './knowledge.ts';
export { LESSON, MINUS } from './explain.ts';
export { fingerprint } from './search/pirate.ts';
