/** OP10-063 Vinsmoke Sanji. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import {
  canPick,
  cardsOf,
  deckOf,
  finishOrder,
  GERMA_LEADER,
  GERMA_STAGE,
  mk,
} from './helpers-a10g2.ts';

const ID = 'OP10-063';
/** {The Vinsmoke Family}{GERMA 66} Character, Event; {The Vinsmoke Family}{Kingdom of GERMA} Character. */
const G_CHAR = 'OP06-064';
const G_EVENT = 'EB02-039';
const KINGDOM_CHAR = 'OP06-063';

describe('OP10-063 Vinsmoke Sanji', () => {
  // Top 5: GERMA Character, GERMA Event, Kingdom of GERMA Stage, plain, Kingdom of GERMA Character; the 6th is GERMA.
  const top5 = [G_CHAR, G_EVENT, GERMA_STAGE, V.c1, KINGDOM_CHAR];
  const start = (leader = GERMA_LEADER) =>
    mk({ leader, hand: [ID], deck: deckOf([...top5, G_CHAR]) });

  it('[On Play] with a Leader whose type includes "GERMA": looks at 5, adds up to 1 card with a type including "GERMA", the rest to the bottom', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'deck', G_EVENT)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([G_EVENT]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(G_EVENT);
    const d = cardsOf(g, 'p1', 'deck');
    expect(d[0]).toBe(G_CHAR); // the 6th card was not looked at
    expect(d.slice(-4).sort()).toEqual([G_CHAR, GERMA_STAGE, V.c1, KINGDOM_CHAR].sort());
    expectDecision(g, 'main', 'p1');
  });

  it('candidates: any category, a type element that includes "GERMA" ({Kingdom of GERMA}, {GERMA 66}); not a plain card', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', G_CHAR))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', G_EVENT))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', GERMA_STAGE))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', KINGDOM_CHAR))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck').slice(-5).sort()).toEqual([...top5].sort());
  });

  it('must do nothing with a Leader whose type does not include "GERMA"', () => {
    const g = start('ST01-001');
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(G_CHAR);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
