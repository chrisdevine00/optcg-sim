/** OP11-047 Vinsmoke Reiju. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, trash, V } from './helpers.ts';
import {
  canPick,
  cardsOf,
  GERMA,
  mk,
  RED_LEADER,
  SHC1,
  VINSMOKE_LEADER,
} from './helpers-op11g2.ts';

const ID = 'OP11-047';
/** A {Kingdom of GERMA} Character (a type including "GERMA", not "GERMA 66"). */
const KINGDOM = 'OP07-062';
// Top 5: a {GERMA 66}, a {Kingdom of GERMA}, two plain cards, a {Straw Hat Crew}; the 6th is another {GERMA 66}.
const top5 = [GERMA, KINGDOM, V.c2, V.c3, SHC1];
const deck = [...top5, GERMA, ...times(4, BLUE)];

describe('OP11-047 Vinsmoke Reiju', () => {
  it('[On Play] with a {The Vinsmoke Family} Leader: looks at 5, takes a card with a type including "GERMA", trashes the rest', () => {
    const g = mk({ leader: VINSMOKE_LEADER, hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', GERMA))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', KINGDOM))).toBe(true); // "GERMA" is a substring of the type
    expect(canPick(g, g.find('p1', 'deck', V.c2))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', SHC1))).toBe(false);
    pick(g, [g.find('p1', 'deck', KINGDOM)]);
    expect(hand(g, 'p1')).toEqual([KINGDOM]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(KINGDOM);
    expect(trash(g, 'p1').sort()).toEqual([GERMA, V.c2, V.c3, SHC1].sort());
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(5);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(GERMA); // the 6th card was not looked at
  });

  it('"up to 1": may take nothing, and then all 5 cards are trashed', () => {
    const g = mk({ leader: VINSMOKE_LEADER, hand: [ID], deck });
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([...top5].sort());
  });

  it('must not fire with a Leader that lacks {The Vinsmoke Family}: nothing is looked at or trashed', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toEqual(deck);
  });

  it('with no "GERMA" card among the 5, nothing can be taken and the 5 are still trashed', () => {
    const g = mk({
      leader: VINSMOKE_LEADER,
      hand: [ID],
      deck: [V.c1, V.c2, V.c3, V.c4, V.c5, GERMA, ...times(4, BLUE)],
    });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(trash(g, 'p1')).toHaveLength(5);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('takes at most 1 card', () => {
    const g = mk({ leader: VINSMOKE_LEADER, hand: [ID], deck });
    play(g, ID);
    pick(g, [g.find('p1', 'deck', GERMA)]);
    expect(hand(g, 'p1')).toEqual([GERMA]);
    expect(trash(g, 'p1')).toHaveLength(4);
  });
});
