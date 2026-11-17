/** EB04-059 Black Rope Dragon Twister: [Main] turn 1 Life face-up: with fewer Characters, K.O. two; [Trigger] draw 2, trash 1. */
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
  PURPLE,
  V,
} from './helpers.ts';
import { ENEL, ids, triggerHit } from './helpers-robin.ts';

const EV = 'EB04-059';

const setup = (mine: string[], theirs: string[], life = [V.c1, PURPLE, BLUE]) =>
  game(
    { leader: ENEL, hand: [EV], life, characters: mine, costArea: { active: 6, rested: 0 } },
    { leader: PLAIN_BLUE, characters: theirs },
  );

describe('EB04-059 Black Rope Dragon Twister', () => {
  it('[Main] with fewer Characters: K.O. a cost 6 or less and a different cost 5 or less Character', () => {
    const g = setup([], [V.c6, V.c5, V.c7]);
    play(g, EV);
    accept(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    const six = g.find('p2', 'characters', V.c6);
    const five = g.find('p2', 'characters', V.c5);
    // First pick: cost 6 or less (6 and 5, not 7).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [six]);
    // Second pick: cost 5 or less, other than the first (only the cost 5 one).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [five]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7]);
    expect(ids(g, 'p2', 'trash').sort()).toEqual([V.c5, V.c6].sort());
  });

  it('[Main] each K.O. is up to 1: either may be skipped', () => {
    const g = setup([], [V.c6, V.c5]);
    play(g, EV);
    accept(g);
    none(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('[Main] with the same number of Characters the Life card is turned but nobody is K.O.d', () => {
    const g = setup([V.c1], [V.c5]);
    play(g, EV);
    accept(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
    expectDecision(g, 'main', 'p1');
  });

  it('[Main] the cost may be declined: no Life card is turned and nothing is K.O.d', () => {
    const g = setup([], [V.c5]);
    play(g, EV);
    decline(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('[Main] with every Life card already face-up the cost cannot be paid', () => {
    const g = setup([], [V.c5], []);
    play(g, EV);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('[Trigger] draw 2 cards and trash 1 card from your hand', () => {
    const g = triggerHit(EV, { hand: [PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([EV, PURPLE].sort());
  });
});
