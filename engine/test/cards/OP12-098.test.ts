/** OP12-098 Hair Removal Fist. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, trash, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import {
  C8,
  cardsIn,
  counterStep,
  RA2,
  RA5,
  RA8,
  RA_LEADER,
  useCounter,
} from './helpers-op12g3.ts';

const ID = 'OP12-098';

/** p2 attacks p1's Leader with a 9000 Character; p1 holds the Event at the counter step. */
const underAttack = (characters: string[]) =>
  counterStep(
    { leader: RA_LEADER, hand: [ID], characters, costArea: { active: 5, rested: 0 } },
    { characters: [V.c7] },
  );

describe('OP12-098 Hair Removal Fist', () => {
  it('[Counter] without a Revolutionary Army Character of cost 8+: +2000 power to the chosen card only', () => {
    const g = underAttack([RA5]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', RA5))).toBe(6000);
  });

  it('with a Revolutionary Army Character of cost 8 or more: the same card gains an additional +2000 (+4000 in all)', () => {
    const g = underAttack([RA8]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', RA8))).toBe(9000);
  });

  it('boundary: a cost-8 Character that is not Revolutionary Army, or a Revolutionary Army one of cost 7, does not count', () => {
    const g = underAttack([C8, RA2]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Character may be the chosen one and gets the whole +4000', () => {
    const g = underAttack([RA8, V.c1]);
    useCounter(g, ID);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000 + 4000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": choosing nothing gives no boost at all (nothing for "that card" to refer to)', () => {
    const g = underAttack([RA8]);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', RA8))).toBe(9000);
    expectDecision(g, 'counter', 'p1');
  });

  it('[Trigger] draws 1 card and trashes 1 card from the top of the deck', () => {
    const g = damageGame(ID, { leader: RA_LEADER, deck: [V.c2, V.c3, V.c4] }, {});
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toContain(V.c2);
    expect(trash(g, 'p1')).toContain(V.c3);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c4]);
    expect(dec(g)?.kind).toBe('main');
  });
});
