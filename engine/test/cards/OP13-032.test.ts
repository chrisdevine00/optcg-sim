/** OP13-032 Nico Robin. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { none, pick, play } from './helpers.ts';
import { C8, C9, canPick, expectDecision, mk, V } from './helpers-op13g2.ts';

const ID = 'OP13-032';

const start = () => mk({ hand: [ID] }, { characters: [V.c1, C8, C9] });
const rest = (g: ReturnType<typeof start>, card: string) => {
  const id = g.find('p2', 'characters', card);
  g.state = applyOp(g.state, { op: 'rest', card: id }).state;
  return g.card(id).rested;
};

describe('OP13-032 Nico Robin', () => {
  it('[On Play]: up to 1 opposing Character with a cost of 8 or less cannot be rested (boundary 8)', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', C8))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', C9))).toBe(false);
    pick(g, [g.find('p2', 'characters', C8)]);
    expect(rest(g, C8)).toBe(false);
    expect(rest(g, V.c1)).toBe(true);
    expect(rest(g, C9)).toBe(true);
  });

  it('"up to 1": none may be chosen, and a second is not asked', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(rest(g, C8)).toBe(true);
    const h = start();
    play(h, ID);
    pick(h, [h.find('p2', 'characters', V.c1)]);
    expectDecision(h, 'main', 'p1');
    expect(rest(h, C8)).toBe(true);
  });

  it('must not offer your own Characters', () => {
    const g = mk({ hand: [ID], characters: [V.c2] }, { characters: [V.c1] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it("the protected Character cannot attack on the opponent's next turn, and the lock ends after their End Phase", () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    g.act({ type: 'endTurn' });
    const id = g.find('p2', 'characters', V.c1);
    const canAtk = (c: string) =>
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p2', 'characters', c));
    expect(canAtk(V.c1)).toBe(false);
    expect(canAtk(C8)).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(id).rested).toBe(false);
    expect(canAtk(V.c1)).toBe(true);
  });
});
