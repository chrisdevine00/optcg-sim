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
export {
  lethal,
  type LethalInput,
  type LethalMode,
  type LethalResult,
  type LethalFacts,
  type AttackerFact,
} from './lethal/lethal.ts';
export type { LineStep } from './lethal/analyse.ts';
export type { TriggerRisk } from './lethal/public.ts';
export type { Cap as LethalCap } from './lethal/search.ts';
export type { DefenceEffect } from './lethal/defence.ts';
export {
  tier1,
  tier2,
  explainLethal,
  guidedCount,
  checkGuidedCount,
  shortName,
  type Tier1,
  type GuidedCount,
  type CountAnswers,
  type CountCheck,
  type LethalContext,
} from './lethal/explain.ts';
export {
  reviewMissedLethal,
  attackersPossible,
  type LethalFlag,
  type ReviewOptions,
} from './lethal/review.ts';
export { answerLethal, insertByPriority, DEFAULT_CAP_MS } from './lethal/request.ts';
