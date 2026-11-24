/** OP11-036 Spotted Neptunian. */
import { describe, expect, it } from 'vitest';
import { dec, hand, none, pick, play, V } from './helpers.ts';
import {
  canPick,
  FISH_LEADER,
  MEGALO,
  mk,
  NEPT6,
  settle,
  SHIRAHOSHI_LEADER,
} from './helpers-op11g1.ts';

const ID = 'OP11-036';
const SHIRA_CHAR = 'OP11-030'; // a [Shirahoshi] Character ({Merfolk}, no Neptunian)
// Top 5: [Shirahoshi], a {Neptunian}, a vanilla, [Megalo] (not Neptunian, not [Shirahoshi]), a vanilla.
const deck = [SHIRA_CHAR, NEPT6, V.c1, MEGALO, V.c2, V.c3, V.c4];
const start = (leader: string) => mk({ leader, hand: [ID], deck });

describe('OP11-036 Spotted Neptunian', () => {
  it('[On Play]: with a [Shirahoshi] Leader, reveals a {Neptunian} card or [Shirahoshi] to hand; the rest to the bottom', () => {
    const g = start(SHIRAHOSHI_LEADER);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', SHIRA_CHAR))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', NEPT6))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', MEGALO))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', SHIRA_CHAR)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([SHIRA_CHAR]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(
      g
        .zone('p1', 'deck')
        .slice(0, 2)
        .map((c) => c.card),
    ).toEqual([V.c3, V.c4]);
  });

  it('"up to 1": may take nothing', () => {
    const g = start(SHIRAHOSHI_LEADER);
    play(g, ID);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
  });

  it('without a [Shirahoshi] Leader nothing is looked at', () => {
    const g = start(FISH_LEADER);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual(deck);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('looks only at the top 5', () => {
    const g = mk({
      leader: SHIRAHOSHI_LEADER,
      hand: [ID],
      deck: [V.c1, V.c2, V.c3, V.c4, V.c5, NEPT6],
    });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', NEPT6))).toBe(false);
  });
});
