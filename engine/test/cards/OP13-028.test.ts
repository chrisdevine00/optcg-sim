/** OP13-028 Shanks. */
import { describe, expect, it } from 'vitest';
import { don, play, V } from './helpers.ts';
import { OP13_028 } from '../../../cards/effects/OP-13/OP13-028.ts';
import { mk, MUSIC_EVENT } from './helpers-op13g1.ts';

const ID = 'OP13-028';

describe('OP13-028 Shanks', () => {
  const canPlay = (g: ReturnType<typeof mk>, card: string) =>
    g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', card), player: 'p1' });

  it('[On Play]: sets all of your DON!! as active', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    // Shanks costs 10: all 10 are rested by the play and are all set active again.
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0 });
  });

  it('then you cannot play cards from your hand this turn: Characters and Events are both barred', () => {
    const g = mk({ hand: [ID, V.c1, MUSIC_EVENT] });
    expect(canPlay(g, V.c1)).toBe(true);
    play(g, ID);
    expect(canPlay(g, V.c1)).toBe(false);
    expect(canPlay(g, MUSIC_EVENT)).toBe(false);
  });

  it('the ban ends with the turn', () => {
    const g = mk({ hand: [ID, V.c1] });
    play(g, ID);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canPlay(g, V.c1)).toBe(true);
  });

  it('a Stage in hand is barred too', () => {
    const g = mk({ hand: [ID, 'OP13-022'] });
    expect(canPlay(g, 'OP13-022')).toBe(true);
    play(g, ID);
    expect(canPlay(g, 'OP13-022')).toBe(false);
  });

  it('the bar is scoped to the hand (M6b-Q33): plays from the trash or deck by an effect are not barred', () => {
    const restrict = JSON.stringify(OP13_028.abilities[0]);
    expect(restrict).toContain('"cannotPlay"');
    expect(restrict).toContain('"from":"hand"');
  });
});
