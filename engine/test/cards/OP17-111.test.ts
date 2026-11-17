/** OP17-111 Charlotte Mont-d'or: [On Play] reveal 2 [Trigger] cards from hand: K.O. up to 2 Characters with cost 1 or less; [Trigger] play this card. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { ENEL, ids, TRIG, TRIG5, triggerHit } from './helpers-robin.ts';

const MONT = 'OP17-111';

describe("OP17-111 Charlotte Mont-d'or", () => {
  const setup = (handCards: string[]) =>
    game(
      { leader: ENEL, hand: [MONT, ...handCards], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [BLUE, V.c1, V.c2] },
    );

  it('[On Play] reveal 2 cards with a [Trigger] (they stay in hand): K.O. up to 2 Characters with cost 1 or less', () => {
    const g = setup([TRIG, TRIG5, BLUE]);
    play(g, MONT);
    accept(g);
    pick(g, [g.find('p1', 'hand', TRIG), g.find('p1', 'hand', TRIG5)]);
    // Targets: only the two cost 1 Characters, not the cost 2 one.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', BLUE), g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c2]);
    expect(ids(g, 'p2', 'trash').sort()).toEqual([BLUE, V.c1].sort());
    expect(hand(g, 'p1')).toEqual([TRIG, TRIG5, BLUE]);
  });

  it('[On Play] "up to 2": a single target is fine', () => {
    const g = setup([TRIG, TRIG5]);
    play(g, MONT);
    accept(g);
    pick(g, [g.find('p1', 'hand', TRIG), g.find('p1', 'hand', TRIG5)]);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([BLUE, V.c2]);
  });

  it('[On Play] with only 1 card with a [Trigger] the cost cannot be paid', () => {
    const g = setup([TRIG, BLUE]);
    play(g, MONT);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('[On Play] the cost may be declined', () => {
    const g = setup([TRIG, TRIG5]);
    play(g, MONT);
    decline(g);
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('[On Play] may K.O. nobody after revealing', () => {
    const g = setup([TRIG, TRIG5]);
    play(g, MONT);
    accept(g);
    pick(g, [g.find('p1', 'hand', TRIG), g.find('p1', 'hand', TRIG5)]);
    none(g);
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('[Trigger] plays this card', () => {
    const g = triggerHit(MONT);
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([MONT]);
  });
});
