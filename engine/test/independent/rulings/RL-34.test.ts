/**
 * RL-34 [On Your Opponent's Attack] and the end-of-Attack-Step check.
 */
import { describe, expect, it } from 'vitest';
import { accept, expectDecision, game, KAIDO, pick, ROCKS, V } from '../../cards/helpers.ts';

describe("RL-34: [On Your Opponent's Attack] and the end-of-Attack-Step check", () => {
  it.todo(
    "RL-34 [open-question Q12]: Kaido's [On Your Opponent's Attack] is still offered after the target is bounced; then the battle ends with no block decision (needs a scripted [When Attacking] bounce, M4b)",
  );

  it("RL-34: Kaido's [On Your Opponent's Attack] is offered after the attacker's [When Attacking] resolves, before the Block Step", () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-048'], hand: ['OP17-045'] },
      {
        leader: KAIDO,
        characters: [{ card: V.c1, rested: true }],
        costArea: { active: 1, rested: 0 },
      },
    );
    const shiki = g.find('p1', 'characters', 'OP17-048');
    g.act({ type: 'attack', attacker: shiki, target: g.find('p2', 'characters', V.c1) });
    // p1's [When Attacking] first (CR 7-1-1-3).
    accept(g);
    pick(g, [g.find('p1', 'hand', 'OP17-045')]);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    // Then p2's Kaido [On Your Opponent's Attack] (DON!! −1): it is still offered.
    expectDecision(g, 'optional', 'p2');
    accept(g);
    pick(g, [shiki]);
    expect(g.power(shiki)).toBe(7000);
    expectDecision(g, 'block', 'p2');
  });
});
