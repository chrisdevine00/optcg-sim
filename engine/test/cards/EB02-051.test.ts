/** EB02-051 Three-Pace Hum Soul Notch Slash. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, option, pick, play } from './helpers.ts';
import { canPick, ids, mk, V } from './helpers-aeb2g2.ts';

const ID = 'EB02-051';
const start = (p2chars: string[] = [V.c2, V.c3, V.c1]) => {
  const g = mk({ hand: [ID], characters: [V.c3] }, { characters: p2chars });
  play(g, ID);
  return g;
};
const mode = (g: ReturnType<typeof start>, n: number) => {
  const d = expectDecision(g, 'choose', 'p1');
  expect(d.options).toHaveLength(2);
  option(g, d.options![n]!.id);
};

describe('EB02-051 Three-Pace Hum Soul Notch Slash', () => {
  it('mode 1: K.O.s a Character with cost 2 or less (cost 2 is the boundary, cost 3 is not offered)', () => {
    const g = start();
    mode(g, 0);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3, V.c1]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c2]);
  });

  it('mode 2: gives a Character -4 cost this turn, any cost (a cost 5 Character is offered), nothing is K.O.d', () => {
    const g = start([V.c2, V.c3, V.c5]);
    mode(g, 1);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(1);
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(3);
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('"up to 1": either mode may pick nothing', () => {
    const g = start();
    mode(g, 0);
    none(g);
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
    const h = start();
    mode(h, 1);
    none(h);
    expect(h.card(h.find('p2', 'characters', V.c3)).cost).toBe(3);
  });

  it("only the opponent's Characters are targets (not mine) and the cost change ends with the turn", () => {
    const g = start([V.c2, V.c5]);
    mode(g, 1);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(1);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('with no opposing Character the mode is chosen and nothing happens', () => {
    const g = start([]);
    mode(g, 0);
    expect(dec(g)?.kind).toBe('main');
  });
});
