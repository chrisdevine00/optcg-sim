/** OP18-013 Pell. */
import { describe, expect, it } from 'vitest';
import { accept, decline, hand, none, pick, play, trash, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { withDon } from './helpers-op14g1.ts';
import { mk, PLAIN_PURPLE, VIVI_L } from './helpers-op18-g1.ts';

const ID = 'OP18-013';
const oppChars = (g: ReturnType<typeof mk>) => g.zone('p2', 'characters').map((c) => c.card);

describe('OP18-013 Pell', () => {
  it('with an {Alabasta} Leader it gains [Rush]; with another Leader it does not', () => {
    const a = mk({ leader: VIVI_L, characters: [ID] });
    const b = mk({ leader: PLAIN_PURPLE, characters: [ID] });
    expect(a.card(a.find('p1', 'characters', ID)).keywords).toContain('Rush');
    expect(b.card(b.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
  });

  it('[On Play] trash a Character (5000 or less): draw 2, trash up to 1 opponent Character with 3000 base power or less', () => {
    const g = mk({ hand: [ID, V.c3, V.c4] }, { characters: [V.c1, V.c2] });
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c4))).toBe(false);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true); // 3000: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // 4000
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(oppChars(g)).toEqual([V.c2]);
    expect(trash(g, 'p2')).toEqual([V.c1]);
  });

  it('"base power": a 3000-base Character with DON!! given (current 5000) is still a candidate', () => {
    const g = mk({ hand: [ID, V.c3] }, { characters: [withDon(V.c1, 2)] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('"up to 1": the opponent Character may be left; the cards are still drawn', () => {
    const g = mk({ hand: [ID, V.c3] }, { characters: [V.c1] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    none(g);
    expect(oppChars(g)).toEqual([V.c1]);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('declined: no trash, no draw, no removal', () => {
    const g = mk({ hand: [ID, V.c3] }, { characters: [V.c1] });
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(oppChars(g)).toEqual([V.c1]);
  });
});
