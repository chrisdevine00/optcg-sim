/**
 * OP11-058 Monkey.D.Luffy (Blue Character, cost 5, 7000, Counter +1000, {Straw Hat Crew}, [Blocker]).
 *
 * Card text: "If you have 5 or more cards in your hand, this Character cannot attack. [Blocker]"
 *
 * Rules: the restriction is continuous and re-evaluated at every moment (CR 8-1-3); "5 or more"
 * includes 5. It stops only this Character's attacks: [Blocker] and other cards are unaffected.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  blockers,
  C11,
  canAttackAnything,
  canHit,
  fill,
  hand,
  kind,
  L11,
  mine,
  need,
  playCard,
  theirs,
} from './kit-op11b.ts';

const LUFFY = 'OP11-058';

function mineWith(handSize: number, p2hand = 0) {
  return mine(
    L11.mono,
    { characters: [LUFFY, C11.c3], hand: fill(BLUE, handSize) },
    { hand: fill(BLUE, p2hand), characters: [{ card: C11.c2, rested: true }] },
  );
}

describe('OP11-058 Monkey.D.Luffy: with 5+ cards in hand it cannot attack; [Blocker]', () => {
  it('with 4 cards in hand it can attack the opponent Leader', () => {
    const g = mineWith(4);
    const luffy = at(g, 'p1', 'characters', LUFFY);
    expect(canAttackAnything(g, luffy)).toBe(true);
    expect(canHit(g, luffy, g.leader('p2'))).toBe(true);
  });

  it('with exactly 5 cards in hand it cannot attack at all', () => {
    const g = mineWith(5);
    const luffy = at(g, 'p1', 'characters', LUFFY);
    expect(canAttackAnything(g, luffy)).toBe(false);
    expect(canHit(g, luffy, g.leader('p2'))).toBe(false);
  });

  it('with 8 cards in hand it still cannot attack, not even a rested Character', () => {
    const g = mineWith(8);
    const luffy = at(g, 'p1', 'characters', LUFFY);
    expect(canHit(g, luffy, at(g, 'p2', 'characters', C11.c2))).toBe(false);
    expect(canAttackAnything(g, luffy)).toBe(false);
  });

  it('other Characters and the Leader can still attack at 5 cards', () => {
    const g = mineWith(5);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', C11.c3))).toBe(true);
    expect(canAttackAnything(g, g.leader('p1'))).toBe(true);
  });

  it('is re-evaluated at once: playing a card from a 5-card hand lets it attack', () => {
    const g = mineWith(5);
    const luffy = at(g, 'p1', 'characters', LUFFY);
    expect(canAttackAnything(g, luffy)).toBe(false);
    playCard(g, BLUE);
    expect(hand(g)).toHaveLength(4);
    expect(canAttackAnything(g, luffy)).toBe(true);
  });

  it('only my own hand counts: 4 for me and 9 for the opponent can attack; 5 for me and 0 for the opponent cannot', () => {
    const a = mineWith(4, 9);
    expect(canAttackAnything(a, at(a, 'p1', 'characters', LUFFY))).toBe(true);
    const b = mineWith(5, 0);
    expect(canAttackAnything(b, at(b, 'p1', 'characters', LUFFY))).toBe(false);
  });

  it('has [Blocker] regardless of hand size and can block with 7 cards in hand', () => {
    const g = theirs(
      L11.mono,
      { characters: [LUFFY], hand: fill(BLUE, 7) },
      { characters: [C11.c3] },
    );
    expect(g.card(at(g, 'p1', 'characters', LUFFY)).keywords).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', C11.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', LUFFY)]);
  });

  it('blocking an attack with it protects the Leader: 7000 beats 5000', () => {
    const g = theirs(
      L11.mono,
      { characters: [LUFFY], hand: fill(BLUE, 5) },
      { characters: [C11.c3] },
    );
    attack(g, at(g, 'p2', 'characters', C11.c3), g.leader('p1'));
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', LUFFY) });
    while (kind(g) === 'counter') g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'trash').map((c) => c.card)).not.toContain(LUFFY);
  });

  it('with an empty hand it attacks and a connecting hit takes a Life card', () => {
    const g = mineWith(0);
    attack(g, at(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    expect(kind(g)).toBe('block');
  });
});
