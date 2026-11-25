/** One detector per kind; WP1–WP4 each edit only their own file. */
import { detect as counterWasted } from './counter-wasted.ts';
import { detect as don } from './don.ts';
import { detect as givenAway } from './given-away.ts';
import { detect as missedLethal } from './missed-lethal.ts';
import { detect as mulligan } from './mulligan.ts';
import { detect as shouldCounter } from './should-counter.ts';
import { detect as target } from './target.ts';
import type { Detector, DetectorContext, FlagKind, ReviewItem, TurnResult } from './types.ts';

export const DETECTORS: Readonly<Record<FlagKind, Detector>> = {
  'missed-lethal': missedLethal,
  'given-away': givenAway,
  'don-unused': don,
  'counter-wasted': counterWasted,
  'should-counter': shouldCounter,
  target,
  mulligan,
};

export function detectorFor(kind: FlagKind): Detector {
  return DETECTORS[kind];
}

/** Run the detector for `item.kind`. */
export function runDetector(item: ReviewItem, ctx: DetectorContext): TurnResult | null {
  return DETECTORS[item.kind](item, ctx);
}
