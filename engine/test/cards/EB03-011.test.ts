/** EB03-011 But If We Ever See Each Other Again... Will You Call Me Your Shipmate?!! */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, passBlock, pick, PLAIN_BLUE, V } from './helpers.ts';
import { activate, STRIKE_L, VIVI_L } from './helpers-eb03g1.ts';

const ID = 'EB03-011';

/** p2 attacks p1's Leader with a 9000 Character; p1 holds the Event and is at the counter step. */
const underAttack = (leader: string) => {
  const g = game(
    { leader, hand: [ID], characters: [V.c3], costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  passBlock(g);
  return g;
};

describe('EB03-011 But If We Ever See Each Other Again...', () => {
  it('[Counter] with a [Nefeltari Vivi] Leader: +4000 to a Leader or Character during this battle', () => {
    const g = underAttack(VIVI_L);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it('[Counter] can boost a Character instead, and lasts only for the battle', () => {
    const g = underAttack(VIVI_L);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter] with another Leader: played, no effect', () => {
    const g = underAttack(STRIKE_L);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
    expectDecision(g, 'counter', 'p1');
  });

  it('[Counter] "up to 1": may boost nothing', () => {
    const g = underAttack(VIVI_L);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("[Trigger]: -2000 to up to 1 of the opponent's Characters during this turn", () => {
    const g = game(
      { leader: STRIKE_L, life: [ID, V.c1, V.c1] },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(7000);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });
});
