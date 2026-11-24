/**
 * EB03-049 I Knew You People Were Behind This. (Event, Black, cost 1, {Thriller Bark Pirates}).
 *
 * Card text: "[Main] You may rest 7 of your DON!! cards: If your Leader is [Perona], play up to 1
 * {Thriller Bark Pirates} type Character card with a cost of 6 or less and up to 1 {Thriller Bark
 * Pirates} type Character card with a cost of 4 or less from your hand or trash.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (a "you may" cost is all or nothing), CR 4-8-1 ("up to"), CR 4-10-1 (a failed
 * "If" stops the effect), CR 2-4-2 (name: the Leader must be named Perona), CR 2-4-3 (exact type).
 * Two separate "up to 1" plays: the first with cost 6 or less, the second with cost 4 or less.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  canCounterNow,
  canFinish,
  chars,
  donSum,
  hand,
  LB,
  mine,
  mustBeUnpayable,
  need,
  none,
  offeredIds,
  pickCards,
  pickRaw,
  put,
  theirs,
  trash,
  useCounter,
  BLUE,
  C14,
} from './kit-eb03b.ts';

const ID = 'EB03-049';
const KUMACY1 = 'OP14-102'; // {Thriller Bark Pirates}, cost 1, vanilla
const LOLA4 = 'OP06-094'; // {Thriller Bark Pirates}, cost 4, 6000, vanilla
const MORIA6 = 'OP16-105'; // {Thriller Bark Pirates}, cost 6, 7000, vanilla (a [Trigger] only)
const OARS8 = 'OP14-101'; // {Thriller Bark Pirates}, cost 8, 10000, vanilla
const PERONA5 = 'OP14-033'; // {Thriller Bark Pirates}, cost 5 (offered only, never played here)
const MARCO = C14.marco; // cost 3, no type of interest

function start(o: {
  leader?: string;
  hand?: string[];
  trash?: string[];
  active?: number;
  chars?: string[];
}) {
  return mine(o.leader ?? LB.perona, {
    hand: [ID, ...(o.hand ?? [])],
    trash: o.trash ?? [],
    characters: o.chars ?? [],
    costArea: { active: o.active ?? 10, rested: 0 },
  });
}

/** Play the Event and pay "rest 7 DON!!"; the first play pick is pending. */
function pay(g: ReturnType<typeof start>) {
  put(g, ID);
  answerMay(g, true);
}

describe('EB03-049 I Knew You People Were Behind This.: [Main] rest 7 DON!!: with a [Perona] Leader, play a {Thriller Bark Pirates} of cost 6 or less and one of cost 4 or less from hand or trash; [Counter] Leader +3000', () => {
  it("plays a cost-6 and a cost-4 {Thriller Bark Pirates} Character from hand; 7 DON!! are rested besides the Event's own cost", () => {
    const g = start({ hand: [MORIA6, LOLA4] });
    pay(g);
    need(g, 'choose', 'p1');
    pickCards(g, [MORIA6]);
    need(g, 'choose', 'p1');
    pickCards(g, [LOLA4]);
    expect(atMain(g)).toBe(true);
    expect(chars(g).sort()).toEqual([LOLA4, MORIA6].sort());
    expect(donSum(g).rested).toBe(8);
    expect(donSum(g).active).toBe(2);
  });

  it('plays from the trash as well as from the hand', () => {
    const g = start({ hand: [MORIA6], trash: [LOLA4] });
    pay(g);
    pickCards(g, [MORIA6]);
    pickCards(g, [LOLA4]);
    expect(chars(g).sort()).toEqual([LOLA4, MORIA6].sort());
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('the first pick offers {Thriller Bark Pirates} Characters of cost 6 or less (cost 5 yes, cost 8 no, other types no)', () => {
    const g = start({ hand: [PERONA5, OARS8, MARCO, KUMACY1], trash: [MORIA6] });
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KUMACY1, MORIA6, PERONA5].sort());
  });

  it('the second pick is limited to cost 4 or less: a cost-6 card played first is not offered again, a cost-5 one is not offered', () => {
    const g = start({ hand: [MORIA6, PERONA5, LOLA4, KUMACY1] });
    pay(g);
    pickCards(g, [MORIA6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KUMACY1, LOLA4].sort());
  });

  it('two cost-6 cards: only one can be played (the second play needs cost 4 or less)', () => {
    const g = start({ hand: [MORIA6, MORIA6] });
    pay(g);
    pickRaw(g, MORIA6);
    // Nothing qualifies for the second play (cost 4 or less): the prompt is asked empty.
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([MORIA6]);
  });

  it('"up to 1" twice: one card, or none, may be played', () => {
    const one = start({ hand: [MORIA6, LOLA4] });
    pay(one);
    pickRaw(one, LOLA4);
    none(one);
    expect(chars(one)).toEqual([LOLA4]);

    const zero = start({ hand: [MORIA6, LOLA4] });
    pay(zero);
    none(zero);
    none(zero);
    expect(atMain(zero)).toBe(true);
    expect(chars(zero)).toEqual([]);
    expect(donSum(zero).rested).toBe(8);
  });

  it('only with a [Perona] Leader: with another Leader the cost may be paid but nothing is played', () => {
    const g = start({ leader: LB.luffy, hand: [MORIA6, LOLA4] });
    put(g, ID);
    answerMay(g, true);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(hand(g).sort()).toEqual([LOLA4, MORIA6].sort());
  });

  it('with fewer than 7 DON!! left to rest after paying the Event the cost cannot be paid: nothing is played', () => {
    const g = start({ hand: [MORIA6], active: 7 });
    put(g, ID);
    mustBeUnpayable(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
  });

  it('declining the cost: no DON!! rested beyond the Event, nothing played', () => {
    const g = start({ hand: [MORIA6] });
    put(g, ID);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(donSum(g).rested).toBe(1);
  });

  it('[Counter]: my Leader gains +3000 during the battle and nothing is played', () => {
    const g = theirs(
      LB.perona,
      { hand: [ID, MORIA6], life: [BLUE, BLUE, BLUE, BLUE], costArea: { active: 3, rested: 0 } },
      {
        costArea: { active: 3, rested: 0 },
      },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    const ev = g.find('p1', 'hand', ID);
    expect(canCounterNow(g, ev)).toBe(true);
    useCounter(g, ev, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(chars(g)).toEqual([]);
  });
});
