/**
 * OP09-087 Charlotte Pudding (Character, Black, cost 2, 0 power, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[On Play] If your opponent has 5 or more cards in their hand, your opponent trashes 1
 * card from their hand."
 *
 * Rules: the opponent chooses the card they trash (CR 8-1-... "your opponent trashes" is their pick,
 * E-Q5 / QA-OP17 OP17-099). The hand size is public (CR 3-1-4), so the prompt may depend on it.
 * Exactly one card is trashed however large the hand is.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  chr,
  decision,
  hand,
  kind,
  LD9,
  mine,
  need,
  offeredIds,
  pickCards,
  playRaw,
  SC9,
  trash,
} from './kit-op09c.ts';

const PUD = 'OP09-087';

const P2_HAND = [SC9.c1, SC9.c2, SC9.c3, SC9.c4, SC9.c5, SC9.c6];

function board(p2hand: string[], myHand: string[] = [PUD], leader: string = LD9.luffy) {
  return mine(leader, { hand: myHand }, { hand: p2hand });
}

describe('OP09-087 Charlotte Pudding: [On Play] opponent with 5+ cards in hand trashes 1', () => {
  it('printed values: Black Character, cost 2, 0 power, Counter +1000', () => {
    const g = board([]);
    const c = g.card(g.find('p1', 'hand', PUD));
    expect(c.cost).toBe(2);
    expect(c.counter).toBe(1000);
    playRaw(g, PUD);
    expect(g.power(chr(g, 'p1', PUD))).toBe(0);
  });

  it("with exactly 5 cards in the opponent's hand the opponent must trash 1", () => {
    const g = board(P2_HAND.slice(0, 5));
    playRaw(g, PUD);
    need(g, 'choose', 'p2');
    expect(offeredIds(g)).toEqual(P2_HAND.slice(0, 5).sort());
    pickCards(g, [SC9.c3]);
    expect(atMain(g)).toBe(true);
    expect(hand(g, 'p2')).toEqual([SC9.c1, SC9.c2, SC9.c4, SC9.c5].sort());
    expect(trash(g, 'p2')).toEqual([SC9.c3]);
  });

  it('the OPPONENT chooses which card to trash (the prompt is theirs, not mine)', () => {
    const g = board(P2_HAND.slice(0, 5));
    playRaw(g, PUD);
    expect(decision(g)?.player).toBe('p2');
    expect(decision(g)?.kind).toBe('choose');
  });

  it('boundary: with 4 cards nothing happens and nobody is asked', () => {
    const g = board(P2_HAND.slice(0, 4));
    playRaw(g, PUD);
    expect(atMain(g)).toBe(true);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('with 6 or more cards exactly one card is trashed', () => {
    const g = board(P2_HAND);
    playRaw(g, PUD);
    need(g, 'choose', 'p2');
    pickCards(g, [SC9.c6]);
    expect(atMain(g)).toBe(true);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(trash(g, 'p2')).toEqual([SC9.c6]);
  });

  it('it is mandatory: the opponent cannot decline the trash', () => {
    const g = board(P2_HAND.slice(0, 5));
    playRaw(g, PUD);
    need(g, 'choose', 'p2');
    // `done` with nothing chosen must not be legal for a mandatory exact-1 pick.
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it("only the opponent's hand is counted: my own large hand does not trigger it", () => {
    const g = board(P2_HAND.slice(0, 4), [PUD, ...P2_HAND]);
    playRaw(g, PUD);
    expect(atMain(g)).toBe(true);
    expect(trash(g, 'p2')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('my own hand is never trashed by it', () => {
    const g = board(P2_HAND.slice(0, 5), [PUD, SC9.c2]);
    playRaw(g, PUD);
    pickCards(g, [SC9.c1]);
    expect(hand(g, 'p1')).toEqual([SC9.c2]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('the condition is checked when the effect resolves, after Pudding has been played (the hand is not changed by playing it)', () => {
    const g = board(P2_HAND.slice(0, 5));
    playRaw(g, PUD);
    expect(kind(g)).toBe('choose');
    act(g, { type: 'pick', choice: g.zone('p2', 'hand')[0]!.instance });
    expect(hand(g, 'p2')).toHaveLength(4);
  });

  it("the opponent's Life, DON!! and field are untouched", () => {
    const g = board(P2_HAND.slice(0, 5));
    const life = g.life('p2');
    playRaw(g, PUD);
    pickCards(g, [SC9.c1]);
    expect(g.life('p2')).toBe(life);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });
});
