/**
 * M6b OP-18 wave (docs/research/m6b-audit/OP-18.md):
 * - G1: an effect gives Stage cards in hand a Counter (OP18-021 Franky: "All Stage cards in your hand
 *   have a +3000 Counter"); such a Stage is trashed in the Counter Step like a Character (CR 7-1-3-1-1
 *   names Character cards, the only ones with a printed Counter, CR 2-10-2).
 * - G2: "You may K.O. 1 of your Stages with a cost of 5 or less" (OP18-066, OP18-072): a K.O. cost may
 *   name your own Stage; it is a real K.O.
 * Planted on vanilla cards and unscripted Stages; each test fails with its gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { queries, whyNot } from '@optcg/engine';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  expectDecision,
  game,
  hand,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

/** Unscripted Stages (inert): cost 3 {Water Seven}, cost 5, cost 6. */
const STAGE3 = 'OP03-075';
const STAGE5 = 'OP05-040';
const STAGE6 = 'OP06-041';

const stageCounter = (value: number): Ability =>
  ({
    id: 'sc',
    kind: 'permanent',
    apply: [
      {
        counter: { target: { from: 'hand', owner: 'you', filter: { category: ['Stage'] } }, value },
      },
    ],
  }) as unknown as Ability;

/** p2 attacks p1's Leader (5000) with a 7000 Character; p1 holds `p1hand`, its Leader gives `ab`. */
function attacked(p1hand: string[], ab: Ability | null = stageCounter(3000)) {
  const g = game(
    { leader: PLAIN_PURPLE, hand: p1hand },
    { leader: PLAIN_BLUE, characters: [V.c5] },
    { turn: 4, activePlayer: 'p2' },
  );
  if (ab) g.state = withAbilities(g.state, PLAIN_PURPLE, [ab]);
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
  g.act({ type: 'block', blocker: null });
  expectDecision(g, 'counter', 'p1');
  return g;
}

describe('OP-18 G1: a Counter given to Stage cards in hand', () => {
  it('the Stage in hand has the Counter value, and only while the giver says so', () => {
    expectValid([stageCounter(3000)]);
    const g = attacked([STAGE3]);
    expect(queries.card(g.state, g.find('p1', 'hand', STAGE3)).counter).toBe(3000);
    const bare = attacked([STAGE3], null);
    expect(queries.card(bare.state, bare.find('p1', 'hand', STAGE3)).counter).toBe(null);
  });

  it('is a legal Counter: trashed from hand, +3000 for the battle, and the attack fails', () => {
    const g = attacked([STAGE3]);
    const st = g.find('p1', 'hand', STAGE3);
    expect(g.legal()).toContainEqual(
      expect.objectContaining({ type: 'counter', card: st, target: g.leader('p1') }),
    );
    g.act({ type: 'counter', card: st, target: g.leader('p1') });
    expect(trash(g, 'p1')).toEqual([STAGE3]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(3); // 7000 against 8000: no damage
  });

  it('a Stage with no Counter given is not a Counter', () => {
    const g = attacked([STAGE3], null);
    const st = g.find('p1', 'hand', STAGE3);
    expect(g.legal().filter((a) => a.type === 'counter')).toEqual([]);
    expect(
      whyNot(g.state, 'p1', { type: 'counter', card: st, target: g.leader('p1') }),
    ).toMatchObject({ rule: 'CR 7-1-3-1-1' });
  });

  it('only the highest Counter applies (CR 2-10-4)', () => {
    const g = attacked([STAGE3]);
    g.state = withAbilities(g.state, PLAIN_PURPLE, [
      stageCounter(3000),
      { ...stageCounter(1000), id: 'sc2' } as Ability,
    ]);
    expect(queries.card(g.state, g.find('p1', 'hand', STAGE3)).counter).toBe(3000);
  });
});

const koStageCost = (lte: number) => [
  { ko: { from: 'stage', owner: 'you', filter: { cost: { lte } }, pick: { exactly: 1 } } },
];
const probe = (lte: number): Ability =>
  ({
    id: 'k',
    kind: 'activate',
    when: 'activateMain',
    cost: koStageCost(lte),
    effect: [{ do: { draw: 1 } }],
  }) as unknown as Ability;

describe('OP-18 G2: a K.O. cost on your own Stage', () => {
  it('validates: a K.O. cost may name your Stage, never an opponent card', () => {
    expectValid([probe(5)]);
    expect(
      errorsOf({
        ...probe(5),
        cost: [{ ko: { from: 'stage', owner: 'opponent', pick: { exactly: 1 } } }],
      }).join(' '),
    ).toMatch(/your own/);
  });

  it('K.O.s your Stage as the cost (a K.O., not a trash), then resolves', () => {
    const g = game({ leader: PLAIN_PURPLE, stage: STAGE5 }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, PLAIN_PURPLE, [probe(5)]);
    const before = hand(g, 'p1').length;
    const ev = g.act({ type: 'activate', card: g.leader('p1'), ability: 'k' });
    if (queries.decision(g.state)?.kind === 'choose') pick(g, [g.find('p1', 'stage', STAGE5)]);
    expect(trash(g, 'p1')).toEqual([STAGE5]);
    expect(g.zone('p1', 'stage')).toEqual([]);
    expect(hand(g, 'p1').length).toBe(before + 1);
    expect([...ev, ...g.events].some((e) => e.type === 'KO')).toBe(true);
  });

  it('cannot be paid without a Stage that matches (cost 6 against "5 or less")', () => {
    const g = game({ leader: PLAIN_PURPLE, stage: STAGE6 }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, PLAIN_PURPLE, [probe(5)]);
    expect(
      g
        .legal()
        .some((a) => a.type === 'activate' && a.card === g.leader('p1') && a.ability === 'k'),
    ).toBe(false);
  });
});
