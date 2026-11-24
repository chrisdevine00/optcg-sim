/** OP13-095 Saint Rosward. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, none, pick, play, PLAIN_PURPLE, V } from './helpers.ts';
import { canPick, CD2, mine, names } from './helpers-op13g4.ts';

const ID = 'OP13-095';

describe('OP13-095 Saint Rosward', () => {
  const run = (mine1: string[], opp: string[]) =>
    mine({ leader: PLAIN_PURPLE, hand: [ID, V.c1], characters: mine1 }, { characters: opp }, 3);
  const pay = (g: ReturnType<typeof run>) => {
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
  };

  it('[On Play] trash 1: K.O. up to 2 Characters with base cost 3 or less', () => {
    const g = run([CD2], [V.c3, V.c2, V.c4]);
    pay(g);
    pick(g, [g.find('p2', 'characters', V.c3), g.find('p2', 'characters', V.c2)]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c4]);
    expect(names(g, 'p1', 'trash')).toEqual([V.c1]);
  });

  it('base cost 4 is not a candidate; "up to 2" allows 1 or 0', () => {
    const g = run([], [V.c3, V.c4]);
    pay(g);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c4]);
    const h = run([], [V.c3]);
    pay(h);
    none(h);
    expect(names(h, 'p2', 'characters')).toEqual([V.c3]);
  });

  it('with a non-{Celestial Dragons} Character on your field the cost is paid but nothing is K.O.d', () => {
    const g = run([V.c1], [V.c3]);
    pay(g);
    if (dec(g)?.kind === 'choose') none(g);
    expect(names(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(names(g, 'p1', 'trash')).toEqual([V.c1]);
  });

  it('declining the optional trash skips the K.O.', () => {
    const g = run([], [V.c3]);
    play(g, ID);
    decline(g);
    expect(names(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(names(g, 'p1', 'trash')).toEqual([]);
  });
});
