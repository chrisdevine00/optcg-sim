/** OP13-119 Portgas.D.Ace. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  BLUE,
  dec,
  don,
  expectDecision,
  game,
  hand,
  none,
  PLAIN_BLUE,
  pick,
  times,
  V,
} from './helpers.ts';
import { atMain, ids, offeredPicks, OTHER_LEADER } from './helpers-w6c2.ts';

const ID = 'OP13-119';
const mk = (p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) =>
  game(
    {
      leader: OTHER_LEADER,
      hand: [ID],
      costArea: { active: 6, rested: 1 },
      life: times(3, BLUE),
      ...p1,
    },
    { leader: PLAIN_BLUE, characters: [V.c4, V.c5, V.c6], hand: [V.c3, V.c5, V.c6], ...p2 },
  );
/** Play Ace and answer the DON!! question (give to the Leader) unless `give` is false. */
const cast = (g: ReturnType<typeof mk>, give = true) => {
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
  // "Give up to 1 rested DON!! card to your Leader": asked as an up to 1 pick on the Leader.
  expect(offeredPicks(g)).toEqual([g.leader('p1')]);
  if (give) pick(g, [g.leader('p1')]);
  else none(g);
};

describe('OP13-119 Portgas.D.Ace', () => {
  it('[On Play]: gives a rested DON!! to your Leader, returns a Character of cost 5 or less, and the opponent plays a Character of cost 4 or less', () => {
    const g = mk();
    cast(g);
    // Only the Characters with cost 5 or less are offered.
    expect(offeredPicks(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c5)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4, V.c6]);
    // One of the rested DON!! (the 6 that paid for Ace, and the 1 already rested) is on the Leader.
    expect(don(g, 'p1')).toMatchObject({ rested: 6, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
    // The opponent chooses from their own hand: the returned cost 5 Character is not eligible, cost 3 is.
    expectDecision(g, 'choose', 'p2');
    expect(offeredPicks(g)).toEqual([g.find('p2', 'hand', V.c3)]);
    pick(g, [g.find('p2', 'hand', V.c3)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4, V.c6, V.c3]);
    expect(hand(g, 'p2').sort()).toEqual([V.c5, V.c5, V.c6].sort());
    expect(atMain(g)).toBe(true);
    expect(dec(g)?.player).toBe('p1');
  });

  it('the Character just returned is one of the opponent’s candidates (cost 4 or less)', () => {
    const g = mk({}, { hand: [V.c6] });
    cast(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expectDecision(g, 'choose', 'p2');
    expect(offeredPicks(g)).toEqual([g.find('p2', 'hand', V.c4)]);
    pick(g, [g.find('p2', 'hand', V.c4)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5, V.c6, V.c4]);
  });

  it('"you may": choosing no Character returns nothing and the opponent plays nothing (and is not asked)', () => {
    const g = mk();
    cast(g);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4, V.c5, V.c6]);
    expect(hand(g, 'p2')).toEqual([V.c3, V.c5, V.c6]);
  });

  it('"up to" on both sides: the opponent may decline to play, and the returned Character stays in their hand', () => {
    const g = mk();
    cast(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expectDecision(g, 'choose', 'p2');
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5, V.c6]);
    expect(hand(g, 'p2')).toContain(V.c4);
  });

  it('"Then" after the DON!! give: declining the give ("up to 1") does not stop the return', () => {
    const g = mk();
    cast(g, false);
    expect(don(g, 'p1')).toMatchObject({ rested: 7, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(offeredPicks(g)).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expectDecision(g, 'choose', 'p2');
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('[Rush] only while you have 3 or less Life cards (the boundary is 3)', () => {
    const three = mk();
    cast(three);
    none(three);
    expect(three.card(three.find('p1', 'characters', ID)).keywords).toContain('Rush');

    const four = mk({ life: times(4, BLUE) });
    cast(four);
    none(four);
    expect(four.card(four.find('p1', 'characters', ID)).keywords).not.toContain('Rush');

    const zero = mk({ life: [] });
    cast(zero);
    none(zero);
    expect(zero.card(zero.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });
});
