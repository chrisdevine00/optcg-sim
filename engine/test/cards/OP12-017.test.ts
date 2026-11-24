/** OP12-017 Color of Observation Haki. */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import {
  accept,
  decline,
  don,
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
import { cardsOf, finishOrder } from './helpers-luffyace.ts';
import { choices, RAYLEIGH_C, RAYLEIGH_LEADER, RED_LEADER } from './helpers-op12g1.ts';

const ID = 'OP12-017';
/** Red Event (cost 1) and a Purple Event (cost 0). */
const RED_EVENT = 'OP01-028';
const PURPLE_EVENT = 'OP15-074';
/** Looked at: cost 3 Character, cost 2 Character, red Event, purple Event; then the 5th card. */
const deck = [V.c3, V.c2, RED_EVENT, PURPLE_EVENT, PURPLE, V.c6];

describe('OP12-017 Color of Observation Haki', () => {
  const start = (p1: Record<string, unknown> = {}) =>
    game(
      {
        leader: RAYLEIGH_LEADER,
        hand: [ID],
        deck,
        costArea: { active: 3, rested: 0 },
        ...p1,
      },
      { leader: PLAIN_BLUE },
    );

  it('[Main]: give 1 active DON!! to your [Silvers Rayleigh]: look at 4, take 1 red Event or 1 Character with cost 3 or more', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, given: 1 });
    expect(g.card(g.leader('p1')).don).toBe(1);
    const v = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v.looking).toHaveLength(4);
    // Boundary: the cost 3 Character and the red Event; not the cost 2 Character, not the purple Event.
    expect(choices(g).sort()).toEqual(
      [g.find('p1', 'deck', V.c3), g.find('p1', 'deck', RED_EVENT)].sort(),
    );
    pick(g, [g.find('p1', 'deck', V.c3)]);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(V.c3);
    finishOrder(g);
    // 3 cards went to the bottom; the card that was not looked at is on top.
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(PURPLE);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length - 1);
  });

  it('takes the red Event instead; only 1 card in all', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'deck', RED_EVENT)]);
    expect(hand(g, 'p1')).toEqual([RED_EVENT]);
  });

  it('may take nothing (all 4 go to the bottom)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(PURPLE);
  });

  it('works with a [Silvers Rayleigh] Character (the DON!! goes to it)', () => {
    const g = start({ leader: RED_LEADER, characters: [RAYLEIGH_C] });
    play(g, ID);
    accept(g);
    expect(g.card(g.find('p1', 'characters', RAYLEIGH_C)).don).toBe(1);
  });

  it('"You may": declining gives no DON!! and looks at nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, given: 0 });
    expect(cardsOf(g, 'p1', 'deck')).toEqual(deck);
  });

  it('with no [Silvers Rayleigh] or no active DON!! the cost cannot be paid', () => {
    const g = start({ leader: RED_LEADER });
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    const h = start({ costArea: { active: 0, rested: 3 } });
    // The Event itself costs 0, so it can still be played.
    play(h, ID);
    expect(h.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });
});
