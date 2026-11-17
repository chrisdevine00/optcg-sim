/** OP17-098 Gum-Gum Kong Gun. */
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
  trash,
  V,
} from './helpers.ts';
import { GIANT } from './helpers-sabo.ts';

describe('OP17-098 Gum-Gum Kong Gun', () => {
  const main = (chars: string[], opp: string[], active = 7) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-098'],
        characters: chars,
        costArea: { active, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: opp },
    );
    play(g, 'OP17-098');
    return g;
  };

  it("[Main]: rest 6 DON!!, then with a cost 12+ Character K.O. up to 2 of the opponent's cost 6 or less Characters", () => {
    const g = main([GIANT], [V.c6, V.c7, V.c1]);
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    // The cost 7 Character is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c6), g.find('p2', 'characters', V.c1)]);
    expect(trash(g, 'p2').sort()).toEqual([V.c1, V.c6].sort());
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c7]);
  });

  it('[Main]: "up to 2" allows K.O.ing only 1, or none', () => {
    const one = main([GIANT], [V.c6, V.c1]);
    accept(one);
    payDon(one);
    pick(one, [one.find('p2', 'characters', V.c6)]);
    expect(one.zone('p2', 'characters')).toHaveLength(1);
    const zero = main([GIANT], [V.c6]);
    accept(zero);
    payDon(zero);
    none(zero);
    expect(zero.zone('p2', 'characters')).toHaveLength(1);
  });

  it('[Main]: the rest-6-DON!! cost may be declined; nothing happens', () => {
    const g = main([GIANT], [V.c6]);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 1 });
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it("[Main]: the DON!! are spent even when no Character has a cost of 12 or more, and nothing is K.O.'d", () => {
    const g = main([], [V.c6]);
    accept(g);
    payDon(g);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('[Main]: cannot be paid with fewer than 6 more active DON!!', () => {
    const g = main([GIANT], [V.c6], 6);
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-098'],
        costArea: { active: 1, rested: 0 },
        life: [BLUE, BLUE],
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-098'), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    takeDamage(g);
    // 9000 against 8000: the Leader is hit.
    expect(g.life('p1')).toBe(1);
  });
});
