/**
 * OP13-087 Saint Charlos (Character, Black, cost 2, 0 power, Counter +1000, {Celestial Dragons},
 * [Blocker]).
 *
 * Card text: "[Blocker] [On Play] Trash 1 card from the top of your deck."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 3-5-2 (cards go to the top of the trash), trashing from the deck
 * is not drawing and does not activate a [Trigger], CR 9-2-1-2 (a player with 0 cards in the deck
 * loses), the deck is a secret area but its size is public.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  blockers,
  ch,
  chars,
  defend,
  deck,
  hand,
  kind,
  LD13,
  me,
  need,
  playRaw,
  result,
  S13,
  trash,
} from './kit-op13c.ts';

const ID = 'OP13-087';
const pad = (n: number) => Array.from({ length: n }, () => S13.filler);

describe('OP13-087 Saint Charlos: [Blocker]; [On Play] trash 1 card from the top of my deck', () => {
  it('trashes exactly the top card of the deck and asks nothing', () => {
    const g = me(LD13.plain, { hand: [ID], deck: [S13.c5, S13.c3, ...pad(5)] });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([S13.c5]);
    expect(deck(g)).toHaveLength(6);
    expect(deck(g)[0]).toBe(S13.c3);
  });

  it('it is trashed, not drawn: the hand is unchanged', () => {
    const g = me(LD13.plain, { hand: [ID, S13.c2], deck: [S13.c5, ...pad(5)] });
    playRaw(g, ID);
    expect(hand(g)).toEqual([S13.c2]);
  });

  it('a trashed card with a [Trigger] is not activated (it is not played)', () => {
    const g = me(LD13.plain, { hand: [ID], deck: [S13.speed, ...pad(5)] });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([S13.speed]);
    expect(chars(g)).toEqual([ID]);
  });

  it('only one card even with a long deck; the opponent’s deck is untouched', () => {
    const g = me(LD13.plain, { hand: [ID], deck: pad(12) });
    playRaw(g, ID);
    expect(deck(g)).toHaveLength(11);
    expect(deck(g, 'p2')).toHaveLength(15);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('with exactly 2 cards in the deck, 1 is trashed and the game goes on', () => {
    const g = me(LD13.plain, { hand: [ID], deck: [S13.c5, S13.c3] });
    playRaw(g, ID);
    expect(deck(g)).toHaveLength(1);
    expect(result(g)).toBeNull();
    expect(atMain(g)).toBe(true);
  });

  it('trashing the last card of the deck loses the game at once (0 cards in the deck)', () => {
    const g = me(LD13.plain, { hand: [ID], deck: [S13.c5] });
    playRaw(g, ID);
    expect(trash(g)).toEqual([S13.c5]);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('has [Blocker]', () => {
    const g = defend(LD13.plain, { characters: [ID] });
    expect(g.card(ch(g, 'p1', ID)).keywords).toContain('Blocker');
  });

  it('blocks an attack on my Leader: the 0-power Blocker is K.O.’d and no Life is lost', () => {
    const g = defend(LD13.plain, { characters: [ID] });
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([ch(g, 'p1', ID)]);
    act(g, { type: 'block', blocker: ch(g, 'p1', ID) });
    while (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('[On Play] fires only when played: a Charlos already on the field trashes nothing', () => {
    const g = me(LD13.plain, { characters: [ID], deck: pad(6) });
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(6);
  });
});
