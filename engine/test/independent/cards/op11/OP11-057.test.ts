/**
 * OP11-057 Pedro (Blue Character, cost 1, 1000, Counter +1000, {Minks}).
 *
 * Card text: "If you have 4 or less cards in your hand, this Character gains [Blocker]."
 *
 * Rules: a continuous effect, re-evaluated at every moment (CR 8-1-3); "4 or less" includes 4. Only
 * my own hand counts. A rested Character cannot block (CR 7-1-2-1).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  blockers,
  C11,
  fill,
  hand,
  kind,
  L11,
  mine,
  need,
  passBlock,
  playCard,
  theirs,
} from './kit-op11b.ts';

const PEDRO = 'OP11-057';

function pedroOnMine(handSize: number, p2hand = 0) {
  return mine(
    L11.mono,
    { characters: [PEDRO], hand: fill(BLUE, handSize) },
    { hand: fill(BLUE, p2hand) },
  );
}

function defending(handSize: number, rested = false, p2hand = 0) {
  const g = theirs(
    L11.mono,
    { characters: [{ card: PEDRO, rested }], hand: fill(BLUE, handSize) },
    { characters: [C11.c2], hand: fill(BLUE, p2hand) },
  );
  attack(g, at(g, 'p2', 'characters', C11.c2), g.leader('p1'));
  return g;
}

describe('OP11-057 Pedro: with 4 or less cards in hand, gains [Blocker]', () => {
  it('has [Blocker] with exactly 4 cards in hand', () => {
    const g = pedroOnMine(4);
    expect(g.card(at(g, 'p1', 'characters', PEDRO)).keywords).toContain('Blocker');
  });

  it('has no [Blocker] with 5 cards in hand', () => {
    const g = pedroOnMine(5);
    expect(g.card(at(g, 'p1', 'characters', PEDRO)).keywords).not.toContain('Blocker');
  });

  it('has [Blocker] with an empty hand', () => {
    const g = pedroOnMine(0);
    expect(g.card(at(g, 'p1', 'characters', PEDRO)).keywords).toContain('Blocker');
  });

  it('is re-evaluated continuously: playing a card from a 5-card hand grants [Blocker] at once', () => {
    const g = pedroOnMine(5);
    const pedro = at(g, 'p1', 'characters', PEDRO);
    expect(g.card(pedro).keywords).not.toContain('Blocker');
    playCard(g, BLUE);
    expect(hand(g)).toHaveLength(4);
    expect(g.card(pedro).keywords).toContain('Blocker');
  });

  it('with 4 cards it can block an attack on my Leader, and the Leader takes no damage', () => {
    const g = defending(4);
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', PEDRO)]);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', PEDRO) });
    expect(g.life('p1')).toBe(4);
  });

  it('with 5 cards it is not offered as a blocker', () => {
    const g = defending(5);
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
    passBlock(g);
  });

  it('only my own hand counts: 5 cards for me and 0 for the opponent gives no [Blocker]; 4 for me and 8 for the opponent does', () => {
    const a = pedroOnMine(5, 0);
    expect(a.card(at(a, 'p1', 'characters', PEDRO)).keywords).not.toContain('Blocker');
    const b = pedroOnMine(4, 8);
    expect(b.card(at(b, 'p1', 'characters', PEDRO)).keywords).toContain('Blocker');
  });

  it('a rested Pedro has the keyword but cannot block', () => {
    const g = defending(2, true);
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
  });

  it('blocking with the 1000-power Pedro K.O.s it', () => {
    const g = defending(1);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', PEDRO) });
    while (kind(g) === 'counter') g.act({ type: 'endCounter' });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(PEDRO);
  });
});
