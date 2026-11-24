/** EB03-020 There You Are, Sore Loser! */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, passBlock, pick, PLAIN_BLUE, V } from './helpers.ts';
import { activate, FILM2, FILM3, STRIKE_L } from './helpers-eb03g1.ts';

const ID = 'EB03-020';

/** p2 attacks p1's Leader with a 9000 Character; p1 holds the Event at the counter step. */
const underAttack = (characters: string[]) => {
  const g = game(
    { leader: STRIKE_L, hand: [ID], characters, costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  passBlock(g);
  return g;
};

describe('EB03-020 There You Are, Sore Loser!', () => {
  it('[Counter] with fewer than 2 {FILM} Characters: +2000 only', () => {
    const g = underAttack([FILM3, V.c1]);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('[Counter] with 2 {FILM} Characters: the same card gains an additional +2000 (4000 in all)', () => {
    const g = underAttack([FILM3, FILM2]);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    pick(g, [g.find('p1', 'characters', FILM3)]);
    expect(g.power(g.find('p1', 'characters', FILM3))).toBe(5000 + 4000);
    expect(g.power(g.find('p1', 'characters', FILM2))).toBe(4000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the {FILM} check counts Characters only (the Leader does not), and non-{FILM} do not count', () => {
    const g = underAttack([FILM3, V.c1, V.c2]);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('"up to 1": choosing nothing gives no boost at all', () => {
    const g = underAttack([FILM3, FILM2]);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', FILM3))).toBe(5000);
    expectDecision(g, 'counter', 'p1');
  });

  it('[Trigger]: sets up to 1 of your Characters as active', () => {
    const g = game(
      {
        leader: STRIKE_L,
        life: [ID, V.c1, V.c1],
        characters: [{ card: V.c2, rested: true }, V.c3],
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.card(g.find('p1', 'characters', V.c2)).rested).toBe(false);
  });
});
