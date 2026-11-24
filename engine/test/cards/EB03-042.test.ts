/** EB03-042 Koala. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { koByEffect, ids } from './helpers-op14g4.ts';
import {
  canPick,
  KOALA2,
  mk,
  RA4,
  RA6,
  RA7,
  RA_LEADER,
  ROBIN1,
  ROBIN7,
  TRIG4,
} from './helpers-eb03g2.ts';

const ID = 'EB03-042';
const opp = { turn: 4, activePlayer: 'p2' } as const;

describe('EB03-042 Koala', () => {
  it('with a {Revolutionary Army} Leader this Character gains +4 cost (4 to 8); with another Leader it does not', () => {
    const g = mk({ leader: RA_LEADER, characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(8);
    const h = mk({ characters: [ID] });
    expect(h.card(h.find('p1', 'characters', ID)).cost).toBe(4);
  });

  it("[Opponent's Turn] [On K.O.]: plays a {Revolutionary Army} Character (cost 6 or less, not [Koala]) from the hand", () => {
    const g = mk({ leader: RA_LEADER, characters: [ID], hand: [RA6, RA7, KOALA2, V.c3] }, {}, opp);
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', RA6))).toBe(true); // boundary: cost 6
    expect(canPick(g, g.find('p1', 'hand', RA7))).toBe(false); // cost 7
    expect(canPick(g, g.find('p1', 'hand', KOALA2))).toBe(false); // other than [Koala]
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false); // wrong type
    pick(g, [g.find('p1', 'hand', RA6)]);
    expect(ids(g, 'p1', 'characters')).toEqual([RA6]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('plays [Nico Robin] (cost 6 or less) too, from the trash; a cost 7 Robin is not offered', () => {
    const g = mk({ leader: RA_LEADER, characters: [ID], trash: [ROBIN1, ROBIN7] }, {}, opp);
    koByEffect(g, 'p1', ID);
    expect(canPick(g, g.find('p1', 'trash', ROBIN1))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', ROBIN7))).toBe(false);
    pick(g, [g.find('p1', 'trash', ROBIN1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ROBIN1]);
  });

  it('hand and trash together: at most 1 card is played in total', () => {
    const g = mk(
      { leader: RA_LEADER, characters: [ID], hand: [RA4], trash: [RA6, ROBIN1] },
      {},
      opp,
    );
    koByEffect(g, 'p1', ID);
    expect(canPick(g, g.find('p1', 'hand', RA4))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', RA6))).toBe(true);
    pick(g, [g.find('p1', 'trash', RA6)]);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p1', 'characters')).toEqual([RA6]);
    expect(ids(g, 'p1', 'hand')).toEqual([RA4]);
  });

  it('"up to 1": may play nothing', () => {
    const g = mk({ leader: RA_LEADER, characters: [ID], hand: [RA4] }, {}, opp);
    koByEffect(g, 'p1', ID);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it("only on the opponent's turn: a K.O. on your own turn plays nothing", () => {
    const g = mk({ leader: RA_LEADER, characters: [ID], hand: [RA4, TRIG4] });
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});
