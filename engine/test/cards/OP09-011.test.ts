/** OP09-011 Hongo. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { activate, canPick, mk, offeredAb, RHP_LEADER } from './helpers-a09g1.ts';

const ID = 'OP09-011';
const AB = 'activate';
const start = (leader: string = RHP_LEADER, hongo: object | string = ID) =>
  mk({ leader, characters: [hongo as string] }, { characters: [V.c4, V.c1] });

describe('OP09-011 Hongo', () => {
  it('[Activate: Main] rest this Character: with a {Red-Haired Pirates} Leader, -2000 power to up to 1 opponent Character this turn', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), AB);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('with another Leader the ability is still used and Hongo rested, but nothing happens (the If is after the colon)', () => {
    const g = start('ST01-001');
    expect(offeredAb(g, g.find('p1', 'characters', ID), AB)).toBe(true);
    activate(g, g.find('p1', 'characters', ID), AB);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('"up to 1": may choose nobody (Hongo stays rested)', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), AB);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('only opponent Characters can be chosen', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), AB);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(false);
  });

  it('cannot be activated while rested (the rest cost cannot be paid)', () => {
    const g = start(RHP_LEADER, { card: ID, rested: true } as unknown as string);
    expect(offeredAb(g, g.find('p1', 'characters', ID), AB)).toBe(false);
    expect(dec(g)?.kind).toBe('main');
  });
});
