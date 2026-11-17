/** OP14-096 Ground Death. DECISIONS 2026-11-09 B-1 / RL-52: an Event's "You may" cost is asked. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  payDon,
  takeDamage,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  times,
  V,
} from './helpers.ts';

describe('OP14-096 Ground Death', () => {
  const main = (opp: string[], active = 3) => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: ['OP14-096'], costArea: { active, rested: 0 } },
      { leader: PLAIN_BLUE, characters: opp },
    );
    play(g, 'OP14-096');
    return g;
  };

  it("[Main]: rest 2 DON!!, negate up to 1 of the opponent's Characters with a cost of 5 or less this turn", () => {
    const g = main([V.c5, V.c6]);
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    // The cost 6 Character is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    const t = g.find('p2', 'characters', V.c5);
    pick(g, [t]);
    expect(g.card(t).negated).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c6)).negated).toBeFalsy();
    g.act({ type: 'endTurn' });
    expect(g.card(t).negated).toBeFalsy();
  });

  it('[Main]: the cost may be declined (RL-52); no negation', () => {
    const g = main([V.c5]);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    expect(g.card(g.find('p2', 'characters', V.c5)).negated).toBeFalsy();
  });

  it('[Main]: "up to 1" may choose nothing', () => {
    const g = main([V.c5]);
    accept(g);
    payDon(g);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c5)).negated).toBeFalsy();
  });

  it('[Main]: cannot pay with fewer than 2 other active DON!!', () => {
    const g = main([V.c5], 2);
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });

  const counter = (trashSize: number) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP14-096'],
        trash: times(trashSize, BLUE),
        costArea: { active: 1, rested: 0 },
        life: [BLUE, BLUE],
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP14-096'), ability: 'counter' });
    return g;
  };

  it('[Counter]: with 10 or more cards in the trash, +4000 power to your Leader or a Character during this battle', () => {
    const g = counter(10);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    takeDamage(g);
    expect(g.life('p1')).toBe(1);
  });

  it('[Counter]: with 9 cards (the Event itself goes to the trash only afterwards) it has no effect', () => {
    const g = counter(9);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
