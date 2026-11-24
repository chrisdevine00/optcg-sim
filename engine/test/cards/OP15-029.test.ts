/** OP15-029 Bartholomew Kuma. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { mk } from './helpers-op15g1.ts';

const ID = 'OP15-029';

describe('OP15-029 Bartholomew Kuma', () => {
  const start = () => mk({ hand: [ID] }, { characters: [V.c5, V.c4, V.c6] });
  const canAttack = (g: ReturnType<typeof mk>, card: string) =>
    g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p2', 'characters', card));

  it('[On Play]: only Characters with a cost of 5 or less are candidates (cost 5 yes, cost 6 no)', () => {
    const g = start();
    play(g, ID);
    const choices = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : ''));
    expect(choices).toHaveLength(2);
    expect(choices).toContain(g.find('p2', 'characters', V.c5));
    expect(choices).not.toContain(g.find('p2', 'characters', V.c6));
  });

  it("the chosen Character cannot attack on the opponent's next turn; the others can", () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(canAttack(g, V.c5)).toBe(false);
    expect(canAttack(g, V.c4)).toBe(true);
    expect(canAttack(g, V.c6)).toBe(true);
  });

  it('it also cannot be rested by an effect now, and the lock ends after that End Phase', () => {
    const g = start();
    play(g, ID);
    const target = g.find('p2', 'characters', V.c5);
    pick(g, [target]);
    g.state = applyOp(g.state, { op: 'rest', card: target }).state;
    expect(g.card(target).rested).toBe(false);
    g.act({ type: 'endTurn' }); // p2's turn 4
    g.act({ type: 'endTurn' }); // p1's turn 5
    g.act({ type: 'endTurn' }); // p2's turn 6
    expectDecision(g, 'main', 'p2');
    expect(canAttack(g, V.c5)).toBe(true);
  });

  it('"up to 1": may choose nothing, and then nothing is locked', () => {
    const g = start();
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    expect(canAttack(g, V.c5)).toBe(true);
  });

  it('with no Character of cost 5 or less there is nothing to choose', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c6] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });
});
