/** OP15-059 Amazon. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  none,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { canPick } from './helpers-w3s.ts';

const ID = 'OP15-059';

describe('OP15-059 Amazon', () => {
  // p2 attacks p1's Leader with a 9000 Character; p1's Amazon is active.
  const start = (active: number, rested: number, amazonRested = false) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, rested: amazonRested }] },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c1], costArea: { active, rested } },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    return g;
  };

  it('rest this Character: the opponent returns 1 of their active DON!!, and then nothing else happens', () => {
    const g = start(2, 1);
    accept(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expectDecision(g, 'choose', 'p2');
    const deck = don(g, 'p2').deck;
    option(g, '0');
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 1, deck: deck + 1 });
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
    expectDecision(g, 'block', 'p1');
  });

  it('only an active DON!! can be returned: with 1 active and 3 rested, the 3 rested stay', () => {
    const g = start(1, 3);
    accept(g);
    option(g, '0');
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 3 });
  });

  it('if they do not, up to 1 of their Leader or Character cards gets -2000 power this turn (chosen by you)', () => {
    const g = start(2, 0);
    accept(g);
    option(g, '1');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(7000);
    expect(don(g, 'p2')).toMatchObject({ active: 2 }); // nothing returned
  });

  it('"up to 1": the -2000 can be given to nobody', () => {
    const g = start(1, 0);
    accept(g);
    option(g, '1');
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('with no active DON!! they cannot return one: no choice is asked, the -2000 is given', () => {
    const g = start(0, 3);
    accept(g);
    expectDecision(g, 'choose', 'p1'); // straight to your target
    pick(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 3 });
  });

  it('is a "you may": declining keeps Amazon active and nothing happens', () => {
    const g = start(2, 0);
    decline(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(don(g, 'p2')).toMatchObject({ active: 2 });
    expectDecision(g, 'block', 'p1');
  });

  it('a rested Amazon cannot pay the rest cost: the effect is not offered', () => {
    const g = start(2, 0, true);
    expectDecision(g, 'block', 'p1');
    expect(don(g, 'p2')).toMatchObject({ active: 2 });
  });
});
