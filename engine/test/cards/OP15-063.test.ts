/** OP15-063 Gedatsu. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  dec,
  decline,
  don,
  expectDecision,
  hand,
  none,
  payDon,
  pick,
  play,
  V,
} from './helpers.ts';
import { DRESSROSA_LEADER, idsOf, koedInBattle, KUMACY, mine } from './helpers-op15g2.ts';

const ID = 'OP15-063';

describe('OP15-063 Gedatsu', () => {
  const start = (active: number) =>
    mine(DRESSROSA_LEADER, { hand: [ID], deck: [V.c1, V.c2, V.c3] }, {}, active);

  it('[On Play] DON!! -1: draw 1 card', () => {
    const g = start(3);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('the DON!! -1 may be declined: nothing is drawn and no DON!! returns', () => {
    const g = start(3);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(7);
  });

  it('the DON!! rested to play it is on the field and can be the one returned', () => {
    const g = start(1);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });

  const ko = (donN: number, opp: string[]) =>
    koedInBattle(
      ID,
      { leader: DRESSROSA_LEADER, costArea: { active: donN, rested: 0 } },
      {
        characters: opp,
      },
    );

  it("[On K.O.] with 6 DON!! K.O. up to 1 of your opponent's Characters with 2000 power or less", () => {
    const g = ko(6, [KUMACY, V.c1]);
    expectDecision(g, 'choose', 'p1');
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(1); // the 3000 power Character is not a candidate
    pick(g, [g.find('p2', 'characters', KUMACY)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([KUMACY]);
    expect(idsOf(g, 'p2', 'characters')).toContain(V.c1);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = ko(6, [KUMACY]);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toContain(KUMACY);
  });

  it('with 7 DON!! the condition fails and nothing is asked', () => {
    const g = ko(7, [KUMACY]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(idsOf(g, 'p2', 'characters')).toContain(KUMACY);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('a Character with 3000 power is out of range even alone', () => {
    const g = ko(6, [V.c1]);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(idsOf(g, 'p2', 'characters')).toContain(V.c1);
  });
});
