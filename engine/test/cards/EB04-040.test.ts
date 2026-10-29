/** EB04-040 Flame Dragon Torch. QA-OP14 EB04-040. */
import { describe, expect, it } from 'vitest';
import {
  don,
  expectDecision,
  game,
  KAIDO,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';

describe('EB04-040 Flame Dragon Torch', () => {
  it("[Main] rest 6 DON!!: your [Kaido] +3000, then rest an opponent's Character", () => {
    const g = game(
      { leader: KAIDO, hand: ['EB04-040'], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
    );
    play(g, 'EB04-040');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
  });

  it('QA: with no [Kaido] on the field the [Main] still rests', () => {
    const g = game(
      { leader: 'ST04-001', hand: ['EB04-040'], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
    );
    play(g, 'EB04-040');
    // ST04-001 is also named Kaido; use a non-Kaido check by choosing none.
    g.act({ type: 'done' });
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(true);
  });

  it('[Counter] DON!! −1: your Leader +4000 during this battle', () => {
    const g = game(
      { leader: KAIDO, hand: ['EB04-040'], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'optional', accept: false });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'EB04-040'), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(don(g, 'p1')).toMatchObject({ active: 0, deck: 10 });
    expectDecision(g, 'counter');
  });
});
