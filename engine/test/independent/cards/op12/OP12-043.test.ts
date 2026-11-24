/**
 * OP12-043 Kuzan (Character, Blue, cost 6, 8000, no Counter, {Navy}).
 *
 * Card text: "If you have 5 or more cards in your hand, this Character gains +1 cost. [On Play] You
 * may trash 1 card from your hand: Up to 1 of your opponent's Characters cannot attack until the
 * end of your opponent's next End Phase."
 *
 * Rules: the hand count includes every card in my hand at the time (CR 4-9 derived cost). "You may
 * ... :" is an optional cost; if it is not paid the effect does not resolve (CR 8-3-1-4). "Up to
 * 1" may be none. A duration "until the end of your opponent's next End Phase" set on my turn
 * covers the opponent's coming turn and ends at its End Phase (rules-digest, RL-11 D-2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attackers,
  cast,
  chars,
  costOf,
  hand,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickInst,
  SB,
  toMyNextMain,
  trash,
  yes,
} from './kit-op12b.ts';

const KUZAN = 'OP12-043';

/** p1 plays Kuzan with `rest` as the rest of the hand, pays with `pay`, and targets `target`. */
function playAndTarget(handRest: string[], pay: string, target: string) {
  const g = mine(LB.croc, { hand: [KUZAN, ...handRest] }, { characters: [SB.marco, SB.kingdew] });
  cast(g, KUZAN);
  yes(g, 'p1');
  payHand(g, [pay]);
  need(g, 'choose', 'p1');
  pickInst(g, [g.find('p2', 'characters', target)]);
  return g;
}

describe('OP12-043 Kuzan: +1 cost with 5+ cards in hand; [On Play] trash 1: a Character cannot attack', () => {
  it("[On Play] pay 1 card: the chosen Character cannot attack during the opponent's next turn", () => {
    const g = playAndTarget([SB.sai, SB.mohji], SB.sai, SB.marco);
    expect(trash(g)).toEqual([SB.sai]);
    expect(g.card(g.find('p2', 'characters', SB.marco)).cannotAttack).toBe(true);
    expect(g.card(g.find('p2', 'characters', SB.kingdew)).cannotAttack).toBeFalsy();
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(attackers(g)).toContain(g.find('p2', 'characters', SB.kingdew));
    expect(attackers(g)).not.toContain(g.find('p2', 'characters', SB.marco));
  });

  it('the restriction ends at the End Phase of that opponent turn: it can attack on their following turn', () => {
    const g = playAndTarget([SB.sai, SB.mohji], SB.sai, SB.marco);
    toMyNextMain(g);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(attackers(g)).toContain(g.find('p2', 'characters', SB.marco));
  });

  it('must not remove anything: the restricted Character stays on the field and so does Kuzan', () => {
    const g = playAndTarget([SB.sai, SB.mohji], SB.sai, SB.marco);
    expect(chars(g, 'p2')).toEqual([SB.kingdew, SB.marco].sort());
    expect(chars(g)).toEqual([KUZAN]);
  });

  it('"you may": declining the cost trashes nothing and restricts nothing', () => {
    const g = mine(LB.croc, { hand: [KUZAN, SB.sai] }, { characters: [SB.marco] });
    cast(g, KUZAN);
    no(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([SB.sai]);
    expect(g.card(g.find('p2', 'characters', SB.marco)).cannotAttack).toBeFalsy();
    expect(kind(g)).toBe('main');
  });

  it('unpayable cost (empty hand): the effect cannot be used and nothing is restricted', () => {
    const g = mine(LB.croc, { hand: [KUZAN] }, { characters: [SB.marco] });
    cast(g, KUZAN);
    // Either no prompt, or the "use" question with accept unavailable (DECISIONS 2026-10-29).
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(g.card(g.find('p2', 'characters', SB.marco)).cannotAttack).toBeFalsy();
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": after paying, the target may be left empty; the card is still trashed', () => {
    const g = mine(LB.croc, { hand: [KUZAN, SB.sai] }, { characters: [SB.marco] });
    cast(g, KUZAN);
    yes(g, 'p1');
    payHand(g, [SB.sai]);
    need(g, 'choose', 'p1');
    none(g);
    expect(trash(g)).toEqual([SB.sai]);
    expect(g.card(g.find('p2', 'characters', SB.marco)).cannotAttack).toBeFalsy();
  });

  it("only the opponent's Characters are offered (not my own, not either Leader)", () => {
    const g = mine(
      LB.croc,
      { hand: [KUZAN, SB.sai], characters: [SB.hajrudin] },
      { characters: [SB.marco, SB.kingdew] },
    );
    cast(g, KUZAN);
    yes(g, 'p1');
    payHand(g, [SB.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.kingdew, SB.marco].sort());
  });

  it('cost: 5 or more cards in hand gives cost 7; 4 cards gives 6', () => {
    const five = mine(LB.croc, {
      characters: [KUZAN],
      hand: [SB.sai, SB.sai, SB.sai, SB.sai, SB.sai],
    });
    expect(costOf(five, five.find('p1', 'characters', KUZAN))).toBe(7);
    const four = mine(LB.croc, { characters: [KUZAN], hand: [SB.sai, SB.sai, SB.sai, SB.sai] });
    expect(costOf(four, four.find('p1', 'characters', KUZAN))).toBe(6);
  });

  it("cost: more than 5 cards in hand is still only +1; the opponent's hand does not count", () => {
    const many = mine(LB.croc, { characters: [KUZAN], hand: Array(8).fill(SB.sai) });
    expect(costOf(many, many.find('p1', 'characters', KUZAN))).toBe(7);
    const theirs5 = mine(
      LB.croc,
      { characters: [KUZAN], hand: [SB.sai] },
      { hand: Array(6).fill(SB.sai) },
    );
    expect(costOf(theirs5, theirs5.find('p1', 'characters', KUZAN))).toBe(6);
  });
});
