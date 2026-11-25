/** OP10-102 Emporio.Ivankov. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  canActivate,
  canPick,
  expectDecision,
  hand,
  idsOf,
  mk,
  none,
  pick,
  RA4,
  RA5,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-102';
const RA_C = 'OP05-012'; // Hack, {Revolutionary Army}, cost 3 / 5000
const LIFE = ['OP02-060', 'ST05-007', V.c3];
const start = (p1: object = {}) =>
  mk({ characters: [ID, RA4, RA5, RA_C, V.c1], life: LIFE, ...p1 });

describe('OP10-102 Emporio.Ivankov', () => {
  it('up to 3 Revolutionary Army Characters get +1000 power, then the top Life card goes to your hand', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // not Revolutionary Army
    pick(g, [
      g.find('p1', 'characters', ID),
      g.find('p1', 'characters', RA4),
      g.find('p1', 'characters', RA5),
    ]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', RA4))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', RA5))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', RA_C))).toBe(5000);
    expect(hand(g, 'p1')).toEqual([LIFE[0]]);
    expect(idsOf(g, 'p1', 'life')).toEqual([LIFE[1], LIFE[2]]);
  });

  it('at most 3 can be chosen: after 3 picks no fourth is offered', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    for (const c of [ID, RA4, RA5]) g.act({ type: 'pick', choice: g.find('p1', 'characters', c) });
    expect(canPick(g, g.find('p1', 'characters', RA_C))).toBe(false);
  });

  it('"up to 3": may choose fewer or none; the Life card is still added', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(g.power(g.find('p1', 'characters', RA4))).toBe(6000);
    expect(hand(g, 'p1')).toEqual([LIFE[0]]);
    expect(g.life('p1')).toBe(2);
  });

  it('with no Life cards nothing is added (the boost still applies)', () => {
    const g = start({ life: [] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'characters', RA4)]);
    expect(g.power(g.find('p1', 'characters', RA4))).toBe(7000);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('Once Per Turn', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('the boost lasts this turn only', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(7000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });
});
