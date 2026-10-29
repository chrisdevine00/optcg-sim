/** OP17-039 Rocks.D.Xebec (Leader). RL-44; QA-OP17 OP17-039. */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import {
  accept,
  BLUE,
  dec,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  PLAIN_PURPLE,
  ROCKS,
  trash,
} from './helpers.ts';

const ROCKS_CARD = 'OP17-040'; // Edward.Newgate, type "Rocks Pirates"

describe('OP17-039 Rocks.D.Xebec', () => {
  const attackWith = (deck: string[], handCards: string[]) => {
    const g = game({ leader: ROCKS, hand: handCards, deck }, { leader: PLAIN_PURPLE });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    return g;
  };

  it('RL-44: trash 1 to reveal; a "Rocks Pirates" top card is drawn with the next one', () => {
    const g = attackWith([ROCKS_CARD, BLUE, BLUE], [BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    const revealed = g.eventsOfType('CardRevealed').at(-1)!;
    expect(revealed.card).toBe(ROCKS_CARD);
    expect(hand(g, 'p1').sort()).toEqual([BLUE, ROCKS_CARD].sort());
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'deck')).toHaveLength(1);
    expectDecision(g, 'block', 'p2');
  });

  it('RL-44: a miss leaves the revealed card face-down on top, known to both players', () => {
    const g = attackWith([BLUE, ROCKS_CARD], [BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([BLUE, ROCKS_CARD]);
    const v = project(g.state, 'p2') as unknown as { known: Record<string, string> };
    expect(v.known['p1.deck.0']).toBe(BLUE);
  });

  it('the cost is optional: declining reveals nothing (CR 8-3-1-4)', () => {
    const g = attackWith([ROCKS_CARD, BLUE], [BLUE]);
    decline(g);
    expect(g.eventsOfType('CardRevealed')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('with an empty hand it still asks (the hand is secret) but cannot be used', () => {
    const g = attackWith([ROCKS_CARD, BLUE], []);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    g.act({ type: 'optional', accept: false });
    expect(dec(g)?.kind).toBe('block');
  });
});
