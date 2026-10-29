/** OP17-048 Shiki: [Rush: Character]; [When Attacking]/[On Your Opponent's Attack] [Once Per Turn]. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  game,
  passBlock,
  pick,
  play,
  PLAIN_PURPLE,
  ROCKS,
  V,
} from './helpers.ts';

describe('OP17-048 Shiki', () => {
  it('[Rush: Character]: attacks a rested Character the turn it is played, not the Leader', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-048'], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [{ card: V.c1, rested: true }] },
    );
    play(g, 'OP17-048');
    const shiki = g.find('p1', 'characters', 'OP17-048');
    expect(
      g.isLegal({
        type: 'attack',
        attacker: shiki,
        target: g.find('p2', 'characters', V.c1),
        player: 'p1',
      }),
    ).toBe(true);
    expect(
      g.isLegal({ type: 'attack', attacker: shiki, target: g.leader('p2'), player: 'p1' }),
    ).toBe(false);
  });

  it('trash a "Rocks Pirates" card: −3000 during this turn; once per turn across both timings', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-048'], hand: ['OP17-045', 'OP17-050'] },
      { leader: PLAIN_PURPLE, characters: [V.c6] },
    );
    const shiki = g.find('p1', 'characters', 'OP17-048');
    g.act({ type: 'attack', attacker: shiki, target: g.leader('p2') });
    accept(g);
    pick(g, [g.find('p1', 'hand', 'OP17-045')]);
    const t = g.find('p2', 'characters', V.c6);
    pick(g, [t]);
    expect(g.power(t)).toBe(5000);
    passBlock(g);
    endCounter(g);
    while (g.legal().some((a) => a.type === 'trigger')) g.act({ type: 'trigger', activate: false });
    // Same turn, the Leader attacks: Shiki's ability is spent (only the Leader's own asks).
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    decline(g);
    expectDecision(g, 'block', 'p2');
  });

  it('a hand with no "Rocks Pirates" card cannot pay', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-048'], hand: [BLUE] },
      { leader: PLAIN_PURPLE, characters: [V.c6] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', 'OP17-048'),
      target: g.leader('p2'),
    });
    expectDecision(g, 'optional');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });
});
