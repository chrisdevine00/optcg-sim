/** OP18-008 Chaka. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, hand, pick, play, trash } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { ALA1, mk, PLAIN_PURPLE, V, VIVI_L } from './helpers-op18-g1.ts';

const ID = 'OP18-008';
const has = (g: ReturnType<typeof mk>, kw: string) =>
  g.card(g.find('p1', 'characters', ID)).keywords.includes(kw as never);

describe('OP18-008 Chaka', () => {
  it('with an {Alabasta} Leader it gains [Rush]; with another Leader it does not', () => {
    expect(has(mk({ leader: VIVI_L, characters: [ID] }), 'Rush')).toBe(true);
    expect(has(mk({ leader: PLAIN_PURPLE, characters: [ID] }), 'Rush')).toBe(false);
  });

  it('[On Play] trashing a Character with 5000 power or less draws 2 and gives [Banish] this turn', () => {
    const g = mk({ hand: [ID, V.c3, V.c4] });
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(true); // 5000: the boundary
    expect(canPick(g, g.find('p1', 'hand', V.c4))).toBe(false); // 6000
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(trash(g, 'p1')).toEqual([V.c3]);
    expect(hand(g, 'p1')).toHaveLength(3); // V.c4 + 2 drawn
    expect(has(g, 'Banish')).toBe(true);
  });

  it('[Banish] lasts only this turn', () => {
    const g = mk({ hand: [ID, ALA1] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', ALA1)]);
    expect(has(g, 'Banish')).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(has(g, 'Banish')).toBe(false);
  });

  it('declined: nothing is trashed, drawn or granted', () => {
    const g = mk({ hand: [ID, V.c3] });
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(has(g, 'Banish')).toBe(false);
  });

  it('only Character cards can be trashed: an Event in hand cannot pay the cost', () => {
    const g = mk({ hand: [ID, 'ST02-017'] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });
});
