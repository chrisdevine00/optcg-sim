/** OP11-092 Helmeppo. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import {
  accept,
  BLUE,
  dec,
  decline,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_PURPLE,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { canPick, HELMEPPO_SWORD, NAVY_ONLY, SWORD6, SWORD7 } from './helpers-w5c2.ts';

const ID = 'OP11-092';
/** [Koby] {SWORD}, cost 8 (its [On Play] is not triggered by being merely offered). */
const KOBY8 = 'OP11-119';

const mk = (trashCards: string[] = [SWORD6], h: string[] = [ID, V.c1]) =>
  game(
    {
      leader: PLAIN_PURPLE,
      hand: h,
      trash: trashCards,
      deck: [V.c5, V.c6, BLUE, BLUE],
      costArea: { active: 6, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );
/** Play Helmeppo, pay the cost with V.c1, and stop at the trash choice. */
const start = (g: ReturnType<typeof mk>) => {
  play(g, ID);
  accept(g);
  pick(g, [g.find('p1', 'hand', V.c1)]);
};
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP11-092 Helmeppo', () => {
  it('[On Play]: trash 1 card, draw 1, play a {SWORD} Character from the trash; it goes to the deck bottom at the end of the turn', () => {
    const g = mk();
    start(g);
    expect(hand(g, 'p1')).toEqual([V.c5]); // drew the top card of the deck
    pick(g, [g.find('p1', 'trash', SWORD6)]);
    expect(chars(g)).toEqual([ID, SWORD6]);
    expect(g.card(g.find('p1', 'characters', SWORD6)).rested).toBe(false);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    g.act({ type: 'endTurn' });
    expect(chars(g)).toEqual([ID]);
    // Placed at the bottom of its owner's deck.
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(SWORD6);
  });

  it('offers {SWORD} Characters of cost 8 or less only, and never [Helmeppo]', () => {
    const g = mk([SWORD6, SWORD7, KOBY8, HELMEPPO_SWORD, ID, NAVY_ONLY, V.c2]);
    start(g);
    expect(canPick(g, g.find('p1', 'trash', SWORD6))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', SWORD7))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', KOBY8))).toBe(true); // 8 is the boundary
    expect(canPick(g, g.find('p1', 'trash', HELMEPPO_SWORD))).toBe(false); // named Helmeppo
    expect(canPick(g, g.find('p1', 'trash', ID))).toBe(false); // another copy of itself
    expect(canPick(g, g.find('p1', 'trash', NAVY_ONLY))).toBe(false); // {Navy} but not {SWORD}
    expect(canPick(g, g.find('p1', 'trash', V.c2))).toBe(false);
  });

  it('plays at most one Character (two are eligible)', () => {
    const g = mk([SWORD6, SWORD7]);
    start(g);
    g.act({ type: 'pick', choice: g.find('p1', 'trash', SWORD6) });
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).toEqual([ID, SWORD6]);
  });

  it('the cost is optional: declined, nothing is trashed, drawn or played', () => {
    const g = mk();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([SWORD6]);
    expect(chars(g)).toEqual([ID]);
  });

  it('"up to 1": may play nothing (then nothing is placed); the draw happens either way', () => {
    const g = mk();
    start(g);
    none(g);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([V.c5]);
    g.act({ type: 'endTurn' });
    expect(g.zone('p1', 'deck').some((c) => c.card === SWORD6)).toBe(false);

    const empty = mk([NAVY_ONLY]);
    start(empty);
    expect(dec(empty)?.kind).not.toBe('choose');
    expect(hand(empty, 'p1')).toEqual([V.c5]);
  });

  it('if the Character is gone by the end of the turn nothing is placed; other Characters are not touched', () => {
    const g = mk();
    start(g);
    pick(g, [g.find('p1', 'trash', SWORD6)]);
    g.state = applyOp(g.state, {
      op: 'trashFromField',
      card: g.find('p1', 'characters', SWORD6),
      by: 'p2',
    }).state;
    g.act({ type: 'endTurn' });
    expect(g.zone('p1', 'deck').some((c) => c.card === SWORD6)).toBe(false);
    expect(trash(g, 'p1')).toContain(SWORD6);
    expect(chars(g)).toEqual([ID]);
  });
});
