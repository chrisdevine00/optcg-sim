/** OP12-037 Demon Aura Nine Sword Style Asura Blades Drawn Dead Man's Game. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { cardsOf, counterStep, donArea, SHC_LEADER, useCounter } from './helpers-luffyace.ts';

const ID = 'OP12-037';

describe("OP12-037 Demon Aura Nine Sword Style Asura Blades Drawn Dead Man's Game", () => {
  const start = () =>
    game(
      { leader: SHC_LEADER, hand: [ID], ...donArea(4) },
      { leader: PLAIN_BLUE, characters: [V.c1, V.c2, V.c3], ...donArea(3) },
    );

  it('[Main]: you may rest 3 DON!!: rest up to a total of 2 opposing Characters', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1').rested).toBe(4); // 1 to play, 3 for the effect
    expectDecision(g, 'choose', 'p1');
    const a = g.find('p2', 'characters', V.c1);
    const b = g.find('p2', 'characters', V.c3);
    pick(g, [a, b]);
    expect(g.card(a).rested).toBe(true);
    expect(g.card(b).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
    expect(don(g, 'p2').active).toBe(3);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Main]: the total of 2 may be split between a Character and an opposing DON!! card', () => {
    const g = start();
    play(g, ID);
    accept(g);
    const a = g.find('p2', 'characters', V.c2);
    g.act({ type: 'pick', choice: a });
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    expect(g.card(a).rested).toBe(true);
    expect(don(g, 'p2').rested).toBe(1);
    expect(don(g, 'p2').active).toBe(2);
  });

  it('[Main]: may be two DON!! cards, or fewer than 2 ("up to")', () => {
    const g = start();
    play(g, ID);
    accept(g);
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    expect(don(g, 'p2').rested).toBe(2);
    const one = start();
    play(one, ID);
    accept(one);
    one.act({ type: 'pick', choice: one.find('p2', 'characters', V.c1) });
    one.act({ type: 'done' });
    expect(one.card(one.find('p2', 'characters', V.c1)).rested).toBe(true);
    expect(don(one, 'p2').rested).toBe(0);
  });

  it('[Main]: only active DON!! can be rested (CR 1-3-2-1); rested ones are not candidates', () => {
    const g = game(
      { leader: SHC_LEADER, hand: [ID], ...donArea(4) },
      { leader: PLAIN_BLUE, ...donArea(0, 3) },
    );
    play(g, ID);
    accept(g);
    // Nothing at all to rest: no decision is left over.
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p2').rested).toBe(3);
  });

  it('[Main]: declining the cost leaves everything as it was; unpayable with under 3 active DON!!', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').rested).toBe(1);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
    const poor = game(
      { leader: SHC_LEADER, hand: [ID], ...donArea(3) },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(poor, ID);
    expect(poor.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    // A 7000 attacker beats a 5000 Leader but not an 8000 one.
    const g = counterStep({ leader: SHC_LEADER, hand: [ID], ...donArea(1) }, {}, V.c5);
    expect(g.power(g.leader('p1'))).toBe(5000);
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
    // The battle is over; the boost went with it.
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
