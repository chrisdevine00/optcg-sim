/** ST22-003 Edward.Newgate. */
import { describe, expect, it } from 'vitest';
import { dec, hand, play } from './helpers.ts';
import { ALLY1, deckOf, FORMER3, mk, V, WB4 } from './helpers-lfb.ts';

const ID = 'ST22-003';

describe('ST22-003 Edward.Newgate', () => {
  const start = (top: string) =>
    mk({ hand: [ID], deck: [top, V.c1, V.c2, V.c3] as never, costArea: { active: 10, rested: 0 } });

  it('has [Double Attack]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Double Attack');
  });

  it('[On Play]: a revealed {Whitebeard Pirates} card is drawn with the next one (draw 2)', () => {
    const g = start(WB4);
    play(g, ID);
    expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: WB4, player: 'p1' });
    expect(hand(g, 'p1')).toEqual([WB4, V.c1]);
    expect(deckOf(g, 'p1')).toEqual([V.c2, V.c3]);
  });

  it('a type that only includes "Whitebeard Pirates" counts (Allies, Former)', () => {
    for (const top of [ALLY1, FORMER3]) {
      const g = start(top);
      play(g, ID);
      expect(hand(g, 'p1')).toEqual([top, V.c1]);
    }
  });

  it('must not fire: another type is only revealed and stays on top; nothing is drawn', () => {
    const g = start(V.c4);
    play(g, ID);
    expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: V.c4 });
    expect(hand(g, 'p1')).toEqual([]);
    expect(deckOf(g, 'p1')[0]).toBe(V.c4);
    expect(dec(g)?.kind).toBe('main');
  });
});
