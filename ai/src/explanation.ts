/**
 * The `Explanation` every AI decision carries (ARCHITECTURE §4.5, docs/design/explanations.md).
 * Rookie fills the minimal form; the richer tiers (M5) fill every field.
 */
export interface Evidence {
  text: string;
  figures?: Record<string, number>;
}

export interface Move {
  kind:
    | 'play'
    | 'giveDon'
    | 'activate'
    | 'attack'
    | 'block'
    | 'counter'
    | 'take'
    | 'choose'
    | 'trigger'
    | 'keep'
    | 'redraw'
    | 'endTurn';
  text: string;
  card?: string;
  target?: string;
  count?: number;
}

export interface Explanation {
  conceptId: string;
  claim: string;
  evidence: Evidence[];
  line: Move[] | null;
  outcome: string;
  certainty: 'any-hand' | 'needed-hidden-info' | 'search-incomplete';
  nextTime: string;
  lessonId: string;
  sources: string[];
}

/** The minimal explanation: a claim and nothing to teach from yet. */
export function minimal(conceptId: string, claim: string): Explanation {
  return {
    conceptId,
    claim,
    evidence: [],
    line: null,
    outcome: '',
    certainty: 'any-hand',
    nextTime: '',
    lessonId: '',
    sources: [],
  };
}

/** Where an explanation is shown; the certainty chip's words depend on it (explanations.md). */
export type ExplanationContext = 'review' | 'coach' | 'ai-why' | 'guide' | 'drill';

const LABELS: Record<ExplanationContext, Partial<Record<Explanation['certainty'], string>>> = {
  review: {
    'any-hand': 'Holds whatever they held',
    'needed-hidden-info': 'Hindsight: needed their hidden cards',
    'search-incomplete': 'Not fully checked',
  },
  coach: {
    'any-hand': 'Works against any hand',
    'needed-hidden-info': 'Depends on their hand',
    'search-incomplete': 'Best found, not fully checked',
  },
  'ai-why': {
    'any-hand': 'Public information only',
    'needed-hidden-info': 'Public information only · depends on your hand',
    'search-incomplete': 'Best found in its time',
  },
  guide: { 'any-hand': 'From the guide (sourced)' },
  drill: {
    'any-hand': 'Works against any hand',
    'needed-hidden-info': 'Their real hand: one way to see it',
    'search-incomplete': 'Best found, not fully checked',
  },
};

/**
 * The certainty chip's text in a context ("Certainty labels by context", explanations.md). A guide
 * label names the archetype: "From the Rocks guide (sourced)".
 */
export function certaintyLabel(
  certainty: Explanation['certainty'],
  context: ExplanationContext,
  archetype?: string,
): string {
  const label = LABELS[context][certainty];
  if (!label) throw new Error(`No ${context} label for ${certainty} (explanations.md)`);
  return context === 'guide' && archetype ? `From the ${archetype} guide (sourced)` : label;
}
