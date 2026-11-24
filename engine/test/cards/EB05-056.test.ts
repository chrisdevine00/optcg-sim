/** EB05-056 Nico Olvia: [On Play] You may trash 1 card with a Trigger from your hand: If your Leader is [Nico Robin], draw 2 cards. [Trigger] Play this card. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_PURPLE,
} from './helpers.ts';
import { ROBIN, TRIG, triggerHit } from './helpers-robin.ts';

const OLVIA = 'EB05-056';

describe('EB05-056 Nico Olvia', () => {
  const setup = (leader: string, handExtra: string[]) =>
    game(
      { leader, hand: [OLVIA, ...handExtra], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_PURPLE },
    );

  it('[On Play] trash a card with a [Trigger]: with a [Nico Robin] Leader, draw 2', () => {
    const g = setup(ROBIN, [TRIG, BLUE]);
    play(g, OLVIA);
    accept(g);
    // Only the card with a [Trigger] can be trashed.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', TRIG)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([TRIG]);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('[On Play] with another Leader the card is trashed but nothing is drawn', () => {
    const g = setup(PLAIN_PURPLE, [TRIG, BLUE]);
    play(g, OLVIA);
    accept(g);
    pick(g, [g.find('p1', 'hand', TRIG)]);
    expect(g.zone('p1', 'trash')).toHaveLength(1);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('[On Play] the cost may be declined: nothing is trashed or drawn', () => {
    const g = setup(ROBIN, [TRIG]);
    play(g, OLVIA);
    decline(g);
    expect(hand(g, 'p1')).toEqual([TRIG]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('[On Play] cannot be paid with no card with a [Trigger] in hand', () => {
    const g = setup(ROBIN, [BLUE]);
    play(g, OLVIA);
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });

  it('[Trigger] plays this card', () => {
    const g = triggerHit(OLVIA);
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([OLVIA]);
  });
});
