/** EB02-039 GERMA 66. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  expectDecision,
  hand,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';
import { game, inert, pickableCards } from './helpers-w6c1.ts';

const ID = 'EB02-039';
// {GERMA 66} Characters by name and power (cards/data).
const REIJU_2 = 'OP06-068'; // 2000
const REIJU_5 = ['EB03-031', 'OP06-069']; // 5000
const ICHIJI_4 = 'OP06-060'; // 4000
const ICHIJI_7 = ['OP06-061', 'OP11-043']; // 7000
const YONJI_2 = 'OP06-066'; // 2000
const YONJI_5 = 'OP06-067'; // 5000
const NIJI_3 = 'OP06-064'; // 3000
const NIJI_6 = 'OP11-045'; // 6000
const ALL = [REIJU_2, ...REIJU_5, ICHIJI_4, ...ICHIJI_7, YONJI_2, YONJI_5, NIJI_3, NIJI_6];

describe('EB02-039 GERMA 66', () => {
  /** p1 holds the Event and `handCards`; DON!! on the field: p1 4 (all spent on the Event), p2 `oppDon`. */
  const mk = (handCards: string[], trashCards: string[], oppDon = 4, myDon = 4) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [ID, ...handCards],
        trash: trashCards,
        costArea: { active: myDon, rested: 0 },
      },
      { leader: PLAIN_BLUE, costArea: { active: oppDon, rested: 0 } },
    );
    inert(g, ...ALL);
    return g;
  };
  const start = (g: ReturnType<typeof mk>) => {
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    accept(g);
  };

  it('trashes a {GERMA 66} Character as the cost, then plays one with the same name and 5000 to 7000 power from the trash', () => {
    const g = mk([REIJU_2], [...REIJU_5, ICHIJI_7[0]!]);
    start(g);
    pick(g, [g.find('p1', 'hand', REIJU_2)]);
    expectDecision(g, 'choose', 'p1');
    // Only the Reiju in range: not the other name (Ichiji, 7000), and not the trashed Reiju (2000).
    expect(pickableCards(g).sort()).toEqual([...REIJU_5].sort());
    pick(g, [g.find('p1', 'trash', REIJU_5[1]!)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([REIJU_5[1]]);
    expect(trash(g, 'p1')).toContain(REIJU_2);
    expect(trash(g, 'p1')).toContain(REIJU_5[0]);
  });

  it('power boundaries: the cost card may have exactly 4000, the played one exactly 5000 and exactly 7000', () => {
    const g = mk([ICHIJI_4], [...ICHIJI_7, REIJU_5[0]!]);
    start(g);
    pick(g, [g.find('p1', 'hand', ICHIJI_4)]);
    expect(pickableCards(g).sort()).toEqual([...ICHIJI_7].sort());
    const h = mk([YONJI_2], [YONJI_5]);
    start(h);
    pick(h, [h.find('p1', 'hand', YONJI_2)]);
    expect(pickableCards(h)).toEqual([YONJI_5]);
    // 3000 in the trash with the right name is out of range, 6000 is in.
    const i = mk([NIJI_3], [NIJI_3, NIJI_6]);
    start(i);
    pick(i, [i.find('p1', 'hand', NIJI_3)]);
    expect(pickableCards(i)).toEqual([NIJI_6]);
  });

  it('the cost accepts only a {GERMA 66} Character of 4000 power or less', () => {
    // 5000 is too strong, a non-{GERMA 66} Character does not count (its type is not exactly "GERMA 66").
    const g = mk([YONJI_5, V.c2, ICHIJI_4], []);
    start(g);
    expect(pickableCards(g)).toEqual([ICHIJI_4]);
  });

  it('must not play anything when you have more DON!! than your opponent (the cost is still paid)', () => {
    const g = mk([REIJU_2], [REIJU_5[0]!], 3);
    start(g);
    pick(g, [g.find('p1', 'hand', REIJU_2)]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g, 'p1')).toContain(REIJU_2);
  });

  it('plays when you have fewer or equal DON!! (the field total, not the active ones)', () => {
    // Equal: 4 and 4. Fewer: 4 and 5.
    for (const opp of [4, 5]) {
      const g = mk([REIJU_2], [REIJU_5[0]!], opp);
      start(g);
      pick(g, [g.find('p1', 'hand', REIJU_2)]);
      pick(g, [g.find('p1', 'trash', REIJU_5[0]!)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([REIJU_5[0]]);
    }
  });

  it('"up to 1": may choose nothing; with no same-named card in range in the (public) trash nothing is asked', () => {
    const g = mk([REIJU_2], [REIJU_5[0]!]);
    start(g);
    pick(g, [g.find('p1', 'hand', REIJU_2)]);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    const h = mk([REIJU_2], [ICHIJI_7[0]!]);
    start(h);
    pick(h, [h.find('p1', 'hand', REIJU_2)]);
    expect(dec(h)?.kind).toBe('main');
    expect(h.zone('p1', 'characters')).toHaveLength(0);
  });

  it('declining the cost plays nothing and trashes nothing', () => {
    const g = mk([REIJU_2], [REIJU_5[0]!]);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    decline(g);
    expect(hand(g, 'p1')).toEqual([REIJU_2]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('main');
  });
});
