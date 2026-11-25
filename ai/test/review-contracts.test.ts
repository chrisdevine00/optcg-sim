/** M8 WP0: the review contracts compile, the registry calls each stub, LethalFlag adapts. */
import { describe, expect, it } from 'vitest';
import {
  DETECTORS,
  FLAG_KINDS,
  flagId,
  lethalToReviewFlag,
  lethalToTurnResult,
  minimal,
  runDetector,
  type DetectorContext,
  type FlagKind,
  type LethalFlag,
  type ReviewFlag,
  type ReviewItem,
  type ReviewRequest,
  type ReviewResponse,
  type TurnResult,
} from '../src/index.ts';

/** A context over an empty record: no action at any index, so every detector has nothing to say. */
const ctx = {
  record: { actions: [], seats: { p1: 'human', p2: 'ai' }, auto: [], rewinds: [] },
  stateAt: () => {
    throw new Error('no state in an empty record');
  },
} as unknown as DetectorContext;

describe('review registry', () => {
  it('has exactly one detector per kind and each detector returns null on an empty record', () => {
    expect(Object.keys(DETECTORS).sort()).toEqual([...FLAG_KINDS].sort());
    for (const kind of FLAG_KINDS) {
      const item: ReviewItem = { id: `${kind}:1:0`, kind, turn: 1, index: 0, cost: 'cheap' };
      expect(runDetector(item, ctx), kind).toBeNull();
    }
  });
});

describe('review types', () => {
  it('compile as the spec shapes them', () => {
    const kind: FlagKind = 'don-unused';
    const flag: ReviewFlag = {
      id: flagId(kind, 4, 17),
      kind,
      turn: 4,
      player: 'p1',
      restoreIndex: 12,
      decisionIndex: 17,
      severity: 'minor',
      certainty: 'any-hand',
      explanation: minimal('don', 'x'),
      did: [],
    };
    const result: TurnResult = { itemId: 'i', turn: 4, flags: [flag], notes: [] };
    const out: ReviewResponse[] = [
      { type: 'progress', done: 1, total: 2, turn: 4, turns: 11 },
      { type: 'items', results: [result] },
      { type: 'done', markers: [] },
      { type: 'error', message: 'x' },
    ];
    const inn: ReviewRequest[] = [
      { type: 'cancel' },
      { type: 'prioritise', turn: 3 },
      { type: 'deeper', itemIds: ['i'], factor: 10 },
    ];
    expect(flag.id).toBe('don-unused:4:17');
    expect(out).toHaveLength(4);
    expect(inn).toHaveLength(3);
  });

  it('adapts a LethalFlag to a ReviewFlag, and a marker to a marker', () => {
    const base = {
      turn: 9,
      player: 'p1',
      actionIndex: 5,
      explanation: minimal('lethal', 'You had lethal this turn.'),
      public: {} as LethalFlag['public'],
      actual: null,
    } as const;
    const flag = lethalToReviewFlag({ ...base, kind: 'missed-lethal', severity: 'severe' })!;
    expect(flag).toMatchObject({
      id: 'missed-lethal:9:5',
      restoreIndex: 5,
      severity: 'severe',
      practice: { judge: 'win-this-turn', turn: 9 },
    });
    const marked: LethalFlag = { ...base, kind: 'not-fully-checked', severity: 'marker' };
    expect(lethalToReviewFlag(marked)).toBeNull();
    const tr = lethalToTurnResult(9, [marked]);
    expect(tr.flags).toEqual([]);
    expect(tr.marker).toMatchObject({ turn: 9, reason: 'search-incomplete' });
  });
});
