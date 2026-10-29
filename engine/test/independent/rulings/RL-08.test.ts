/**
 * RL-08 "During this battle" and Counter boosts.
 * rulings.md RL-08 (CR 7-1-3-1-1, 7-1-5-2..7-1-5-4; QA-GR Counter entries).
 *
 * Position: p2's turn (turn 4). p2's Leader ST04-001 (5000) attacks p1's Leader ST01-001 (5000).
 * p1 has EB03-002 Ain (vanilla, Counter +2000) in hand and a rested OP01-010 Komachiyo
 * (vanilla, 3000).
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { act, attack, decision, FILL, fill, L, passBlock, V } from '../helpers.ts';

function g0() {
  return scenario({
    turn: 4,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: L.redLuffy,
      characters: [{ card: V.komachiyo, rested: true }],
      hand: [V.ain],
      life: fill(FILL.red, 5),
      deck: fill(FILL.red, 10),
    },
    p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
  });
}

describe('RL-08: Counter boosts last for the battle', () => {
  it('RL-08: a Counter on a card not being attacked does not help the target and ends with the battle', () => {
    const g = g0();
    const z = g.find('p1', 'characters', V.komachiyo);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'counter', card: g.find('p1', 'hand', V.ain), target: z });
    expect(g.power(z)).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    act(g, { type: 'endCounter' });
    // 5000 ≥ 5000: p2 wins the battle and p1 takes 1 damage.
    expect(g.life('p1')).toBe(4);
    expect(g.power(z)).toBe(3000);
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p2' });
  });

  it('RL-08: a Counter on the Leader stops the hit, and the Leader is back to its power after the battle', () => {
    const g = g0();
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'counter', card: g.find('p1', 'hand', V.ain), target: g.leader('p1') });
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(5);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it.todo(
    'RL-08: "at the end of the battle" effects see the boosted values before they expire (needs M4 effects)',
  );
});
