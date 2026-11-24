/** OP11-029 Charlotte Praline. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, V } from './helpers.ts';
import { canPick, mk } from './helpers-op11g1.ts';

const ID = 'OP11-029';
const start = () => mk({ hand: [ID] }, { characters: [V.c1, V.c2] });

describe('OP11-029 Charlotte Praline', () => {
  it('[On Play]: rests a Character with a cost of 1 or less', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true); // cost 1: boundary
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // cost 2
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('with no cost 1 or less Character nothing is asked', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c2, V.c3] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
  });

  it('has [Blocker]', () => {
    const g = start();
    expect(g.card(g.find('p1', 'hand', ID)).keywords).toContain('Blocker');
  });
});
