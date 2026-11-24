/**
 * EB04-061 Monkey.D.Luffy (Character, Yellow, cost 10, 12000, no Counter, {Straw Hat Crew}/{The Four
 * Emperors}/{Egghead}).
 *
 * Card text: "If you have 1 or less Life cards, give this card in your hand -1 cost. [On Play] You may
 * trash 1 card from your hand: Your Leader gains +2000 power until the end of your opponent's next
 * End Phase. Then, this Character gains [Blocker] until the end of your opponent's next End Phase."
 *
 * Rules: the cost reduction is a permanent effect that works in hand and is re-checked (CR 8-1-3-3),
 * "1 or less" is 0 or 1 Life; the [On Play] cost is optional and paid by trashing any hand card
 * (CR 8-3-1-4); "until the end of your opponent's next End Phase" lasts through my opponent's
 * coming turn and ends at step 6-6-1-2 of their End Phase (RL-11), so it is still there during
 * their turn and gone in mine; "Then" follows the same activated effect.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  BLUE,
  blockers,
  canPlayCard,
  hand,
  kind,
  kw,
  mine,
  need,
  no,
  payHandIfAsked,
  playCardRaw,
  SL,
  takeDamage,
  trash,
  unusable,
  yes,
} from './kit-stb5a.ts';

const ID = 'EB04-061';
const KING = 'OP02-006'; // Red, 7000
const SAI = 'OP01-012';
const THATCH = 'OP02-007'; // Red, 8000

function inHand(life: number, active = 10, rested = 0, extraHand: string[] = [BLUE]) {
  return mine(
    SL.luffy,
    { life: Array(life).fill(BLUE), hand: [ID, ...extraHand], costArea: { active, rested } },
    { characters: [THATCH] },
  );
}
const cost = (g: ReturnType<typeof inHand>) => g.card(g.find('p1', 'hand', ID)).cost;

describe('EB04-061 Monkey.D.Luffy: -1 cost in hand with 1 or less Life', () => {
  it('with 1 Life card the card in hand costs 9', () => {
    expect(cost(inHand(1))).toBe(9);
  });

  it('with 0 Life cards it also costs 9 (a reduction of 1, not more)', () => {
    expect(cost(inHand(0))).toBe(9);
  });

  it('with 2 Life cards it costs the printed 10', () => {
    expect(cost(inHand(2))).toBe(10);
  });

  it('boundary: with 1 Life and 9 active DON!! it can be played; with 2 Life and 9 DON!! it cannot', () => {
    const a = inHand(1, 9, 1);
    expect(canPlayCard(a, a.find('p1', 'hand', ID))).toBe(true);
    const b = inHand(2, 9, 1);
    expect(canPlayCard(b, b.find('p1', 'hand', ID))).toBe(false);
    const c = inHand(2, 10, 0);
    expect(canPlayCard(c, c.find('p1', 'hand', ID))).toBe(true);
  });

  it('with 1 Life and only 8 active DON!! it cannot be played', () => {
    const g = inHand(1, 8, 2);
    expect(canPlayCard(g, g.find('p1', 'hand', ID))).toBe(false);
  });

  it('the cost goes back to 10 once I have 2 Life cards (checked on a second position with 2 Life)', () => {
    const g = inHand(3);
    expect(cost(g)).toBe(10);
  });
});

describe("EB04-061 Monkey.D.Luffy: [On Play] trash 1: Leader +2000 and [Blocker] until the end of my opponent's next End Phase", () => {
  function played(extraHand: string[] = [BLUE]) {
    const g = inHand(1, 10, 0, extraHand);
    playCardRaw(g, ID);
    return g;
  }

  it('paying: Leader gains +2000 and Luffy gains [Blocker]', () => {
    const g = played();
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHandIfAsked(g, [BLUE]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Blocker');
  });

  it('the trash can be any card of the hand', () => {
    const g = played([KING, SAI]);
    yes(g, 'p1');
    payHandIfAsked(g, [KING]);
    expect(trash(g)).toEqual([KING]);
    expect(hand(g)).toEqual([SAI]);
  });

  it('declining: no boost and no [Blocker], nothing trashed', () => {
    const g = played();
    no(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kw(g, g.find('p1', 'characters', ID))).not.toContain('Blocker');
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([BLUE]);
  });

  it('with no other card in hand the cost cannot be paid: no boost, no [Blocker]', () => {
    const g = played([]);
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kw(g, g.find('p1', 'characters', ID))).not.toContain('Blocker');
  });

  it("the Leader boost lasts through the opponent's turn and ends at the end of their End Phase", () => {
    const g = played();
    yes(g, 'p1');
    payHandIfAsked(g, [BLUE]);
    act(g, { type: 'endTurn' });
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Blocker');
    act(g, { type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kw(g, g.find('p1', 'characters', ID))).not.toContain('Blocker');
  });

  it("is not only this turn: still active at the start of the opponent's turn (it did not end with my End Phase)", () => {
    const g = played();
    yes(g, 'p1');
    payHandIfAsked(g, [BLUE]);
    act(g, { type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it("Luffy can block an attack on my Leader during the opponent's turn", () => {
    const g = played();
    yes(g, 'p1');
    payHandIfAsked(g, [BLUE]);
    act(g, { type: 'endTurn' });
    attack(g, g.find('p2', 'characters', THATCH), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });

  it("the boosted Leader (7000) beats the opponent's 5000 Leader attack; the unboosted one (5000) would lose that tie", () => {
    const a = played();
    yes(a, 'p1');
    payHandIfAsked(a, [BLUE]);
    act(a, { type: 'endTurn' });
    attack(a, a.leader('p2'), a.leader('p1'));
    act(a, { type: 'block', blocker: null });
    act(a, { type: 'endCounter' });
    takeDamage(a);
    expect(a.life('p1')).toBe(1);
    const b = played();
    no(b, 'p1');
    act(b, { type: 'endTurn' });
    attack(b, b.leader('p2'), b.leader('p1'));
    act(b, { type: 'block', blocker: null });
    act(b, { type: 'endCounter' });
    takeDamage(b);
    expect(b.life('p1')).toBe(0);
  });
});
