/** OP10-051 Hack. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, V } from './helpers.ts';
import {
  attack,
  canPick,
  cardsOf,
  deckOf,
  finishBattle,
  finishOrder,
  mk,
  RA3,
  RA5,
  RA_EVENT,
} from './helpers-a10g2.ts';

const ID = 'OP10-051';
const FILLER = 'OP02-060';

describe('OP10-051 Hack', () => {
  const start = (top: string[], don = 1) =>
    mk(
      { characters: [{ card: ID, don }], costArea: { active: 5, rested: 0 }, deck: deckOf(top) },
      {},
    );

  it('[DON!! x1] [When Attacking] looks at 3, adds up to 1 {Revolutionary Army} Character card to the hand, the rest to the bottom', () => {
    const g = start([V.c1, RA3, RA5]);
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', RA3)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([RA3]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(RA3);
    const d = cardsOf(g, 'p1', 'deck');
    expect(d).toHaveLength(10 + 3 - 1);
    expect(d[0]).toBe(FILLER); // the 4th card was not looked at
    expect(d.slice(-2).sort()).toEqual([V.c1, RA5].sort());
    finishBattle(g);
  });

  it('only a {Revolutionary Army} Character card is a candidate (not an Event, not another type)', () => {
    const g = start([RA_EVENT, V.c3, RA5]);
    attack(g, g.find('p1', 'characters', ID));
    expect(canPick(g, g.find('p1', 'deck', RA5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', RA_EVENT))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', V.c3))).toBe(false);
  });

  it('"up to 1": may take nothing; all 3 go to the bottom', () => {
    const g = start([RA3, V.c1, V.c2]);
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck').slice(-3).sort()).toEqual([RA3, V.c1, V.c2].sort());
  });

  it('must not fire without a DON!! given to it', () => {
    const g = mk({ characters: [ID], deck: deckOf([RA3, V.c1, V.c2]) });
    attack(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).not.toBe('choose');
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(RA3);
  });

  it('a Character beyond the third card is not looked at', () => {
    const g = start([V.c1, V.c2, V.c3, RA3]);
    attack(g, g.find('p1', 'characters', ID));
    expect(canPick(g, g.find('p1', 'deck', RA3))).toBe(false);
    none(g);
  });
});
