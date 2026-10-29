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
