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
  defaultPlaybook,
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
// M7 WP2: blunder scoring and the DON!! tempo ledger (the app's tempo meter and M8's review import these).
export {
  answerScore,
  scoreDecision,
  warningsOf,
  GAP_THRESHOLD,
  type ScoreContext,
} from './coach/blunder.ts';
export {
  donLedger,
  explainHeld,
  explainUnused,
  ledgerLabel,
  UNUSED_FLAG_AT,
  type DonLedger,
  type HeldReason,
} from './coach/tempo.ts';
export type { BlunderWarning } from './coach/types.ts';
export {
  lethal,
  attackersPossible,
  type LethalInput,
  type LethalMode,
  type LethalState,
  type LethalResult,
  type LethalFacts,
  type AttackerFact,
} from './search/lethal/lethal.ts';
export type { LineStep } from './search/lethal/analyse.ts';
export type { TriggerRisk } from './search/lethal/public.ts';
export type { Cap as LethalCap } from './search/lethal/search.ts';
export type { DefenceEffect } from './search/lethal/defence.ts';
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
} from './search/lethal/explain.ts';
export {
  reviewMissedLethal,
  checkLethalItem,
  planLethalItems,
  lethalCandidateAt,
  type LethalCandidate,
  type LethalFlag,
  type ReviewOptions,
} from './search/lethal/review.ts';
export { answerLethal, insertByPriority, DEFAULT_CAP_MS } from './search/lethal/request.ts';
export { defenceBound, counterProfile, type DefenceBound } from './search/lethal/profile.ts';
export { FALLBACK_COUNTER } from './search/lethal/public.ts';
export {
  actionKey,
  isNotImplemented,
  BLUNDER_KINDS,
  MAX_ALTERNATIVES,
  NOT_IMPLEMENTED,
  type BlunderKind,
  type Certainty,
  type HintAlternative,
  type HintResult,
  type NotImplemented,
  type ScoreTable,
  type ThreatResult,
} from './coach/types.ts';
export { priorityOf, answerCoach, type Work } from './coach/dispatch.ts';
// M8 WP0: review contracts, detector registry, LethalFlag adapter.
export * from './search/review/index.ts';
// M9 WP0: drill contracts and the (stub) banks.
export * from './search/drills/index.ts';
