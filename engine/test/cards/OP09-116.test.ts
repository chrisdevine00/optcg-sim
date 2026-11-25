/** OP09-116 Never Underestimate the Power of Miracles!! (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  counterStep,
  damageGame,
  dec,
  expectDecision,
  idsOf,
  none,
  OTHER_LEADER,
  pick,
  RA4,
  RA5,
  RA_LEADER,
  useCounter,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-116';

describe('OP09-116 Never Underestimate the Power of Miracles!!: [Counter]', () => {
  it('up to 1 of your Leader or Character cards gains +2000 power during this battle', () => {
    const g = counterStep({
      leader: OTHER_LEADER,
      hand: [ID],
      characters: [V.c4],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p1', 'characters', V.c4)]);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'counter', 'p1');
  });

  it('the +2000 ends with the battle', () => {
    const g = counterStep({
      leader: OTHER_LEADER,
      hand: [ID],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    g.act({ type: 'endCounter' });
    while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose nobody', () => {
    const g = counterStep({
      leader: OTHER_LEADER,
      hand: [ID],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('OP09-116 Never Underestimate the Power of Miracles!!: [Trigger]', () => {
  const start = (handCards: string[], leader = RA_LEADER) =>
    damageGame(ID, { leader, hand: handCards });

  it('plays up to 1 Revolutionary Army Character card with a cost of 4 or less from your hand', () => {
    const g = start([RA4, RA5, V.c1]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', RA4))).toBe(true); // cost 4: the boundary
    expect(canPick(g, g.find('p1', 'hand', RA5))).toBe(false); // cost 5
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false); // not Revolutionary Army
    pick(g, [g.find('p1', 'hand', RA4)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([RA4]);
    expect(g.card(g.find('p1', 'characters', RA4)).rested).toBe(false);
    expect(idsOf(g, 'p1', 'hand').sort()).toEqual([RA5, V.c1].sort());
  });

  it('needs no Revolutionary Army Leader', () => {
    const g = start([RA4], OTHER_LEADER);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', RA4)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([RA4]);
  });

  it('"up to 1": may play nothing', () => {
    const g = start([RA4]);
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'hand')).toEqual([RA4]);
  });

  it('no eligible card in hand: nothing is played', () => {
    const g = start([RA5, V.c1]);
    g.act({ type: 'trigger', activate: true });
    // Asked at max 0: skipping it would tell the opponent that no card in the hand matches.
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'hand').sort()).toEqual([RA5, V.c1].sort());
  });
});
