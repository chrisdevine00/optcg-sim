/**
 * ST22-015 I Am Whitebeard!! (Event, Blue, cost 8, {The Four Emperors}/{Whitebeard Pirates}).
 *
 * Card text: "[Main] If your Leader's type includes "Whitebeard Pirates", play up to 1
 * [Edward.Newgate] from your hand. Then, you may add 1 card from the top or bottom of your Life
 * cards to your hand. If you do, up to 1 of your Leader gains +2000 power until the end of your
 * opponent's next turn."
 *
 * Rules: M4b-5 (a "Then" after a failed "If" does not resolve), "up to" pick over a filtered hand is
 * asked (max 0 when nothing matches), CR 8-3-1-4 ("you may" is optional), a played card's [On Play]
 * fires when it is played by an effect.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  canFinish,
  chars,
  choices,
  deck,
  hand,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredIds,
  optionChoices,
  pickInst,
  pickCards,
  playRaw,
  toMyNextMain,
  trash,
  unusable,
  yes,
  donOf,
  SL,
} from './kit-lfb.ts';

const ID = 'ST22-015';
const NEWGATE = 'ST22-003'; // Edward.Newgate, cost 9, 10000, [On Play] reveal top, WBP: draw 2
const NEWGATE_VAN = 'OP12-002'; // Edward.Newgate, cost 5, 6000, vanilla
const MISS = SL.miss;
const PAD = Array.from({ length: 10 }, () => MISS);
const LIFE = [SL.c2, SL.c4, SL.c1, MISS];

function play(
  leader: string,
  handExtra: string[],
  o: { life?: string[]; top?: string[]; chars?: string[] } = {},
) {
  const g = mine(leader, {
    hand: [ID, ...handExtra],
    life: o.life ?? LIFE,
    deck: [...(o.top ?? [MISS]), ...PAD],
    characters: o.chars ?? [],
  });
  playRaw(g, ID);
  return g;
}

/** Pick top or bottom of Life in the pending choice, whether it is offered as options or as cards. */
function pickEnd(g: ReturnType<typeof play>, which: 'top' | 'bottom') {
  const opts = optionChoices(g);
  if (opts.length) {
    const id = opts.find((o) => o.toLowerCase().includes(which));
    if (!id) throw new Error(`no ${which} among ${opts}`);
    act(g, { type: 'pick', choice: { option: id } });
    return;
  }
  const life = g.zone('p1', 'life');
  pickInst(g, [(which === 'top' ? life[0] : life[life.length - 1])!.instance]);
}

describe('ST22-015 I Am Whitebeard!!: play up to 1 [Edward.Newgate] from hand', () => {
  it('with a Whitebeard Pirates Leader, plays [Edward.Newgate] from hand without paying its cost', () => {
    const g = play(LB.aceNewgate, [NEWGATE_VAN, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([NEWGATE_VAN]);
    pickCards(g, [NEWGATE_VAN]);
    expect(chars(g)).toEqual([NEWGATE_VAN]);
    // The Event cost 8 was paid, the Character's cost 5 was not: 2 active DON!! left.
    expect(donOf(g, 'p1').active).toBe(2);
  });

  it('only a card named [Edward.Newgate] is a candidate: another Whitebeard Pirates card is not', () => {
    const g = play(LB.aceNewgate, [NEWGATE_VAN, SL.wb6, SL.former3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([NEWGATE_VAN]);
  });

  it('"up to 1": nothing may be played, and the Life question still follows', () => {
    const g = play(LB.aceNewgate, [NEWGATE_VAN]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([NEWGATE_VAN]);
    need(g, 'optional', 'p1');
  });

  it('with no [Edward.Newgate] in hand the "up to" pick is asked empty (max 0), then the Life question follows', () => {
    const g = play(LB.aceNewgate, [SL.wb6, MISS]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    none(g);
    need(g, 'optional', 'p1');
  });

  it("the played Character's own [On Play] fires: ST22-003 reveals the top card and draws 2 on a hit", () => {
    const g = play(LB.aceNewgate, [NEWGATE], { top: [SL.wb4, SL.c2, MISS] });
    pickCards(g, [NEWGATE]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SL.wb4, SL.c2].sort());
    expect(deck(g)).toHaveLength(11);
  });
});

describe('ST22-015 I Am Whitebeard!!: you may add 1 Life card (top or bottom) to hand; if you do, Leader +2000', () => {
  const upToLife = (o: { life?: string[] } = {}) => {
    const g = play(LB.aceNewgate, [], o);
    if (kind(g) === 'choose') none(g);
    return g;
  };

  it('yes + top: the top Life card goes to hand and my Leader gains +2000 power', () => {
    const g = upToLife();
    yes(g, 'p1');
    pickEnd(g, 'top');
    pickInst(g, [g.leader('p1')]);
    expect(hand(g)).toEqual([SL.c2]);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('yes + bottom: the bottom Life card goes to hand instead', () => {
    const g = upToLife();
    yes(g, 'p1');
    pickEnd(g, 'bottom');
    pickInst(g, [g.leader('p1')]);
    expect(hand(g)).toEqual([MISS]);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('"up to 1 of your Leader": the Life card is added, and the Leader may be left out (no boost)', () => {
    const g = upToLife();
    yes(g, 'p1');
    pickEnd(g, 'top');
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([g.leader('p1')]);
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([SL.c2]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining ("you may"): no Life card moves and there is no power boost ("if you do")', () => {
    const g = upToLife();
    no(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(atMain(g)).toBe(true);
  });

  it("the +2000 lasts until the end of the opponent's next turn, then is gone", () => {
    const g = upToLife();
    yes(g, 'p1');
    pickEnd(g, 'top');
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no Life cards there is nothing to add: no card moves and no boost', () => {
    const g = upToLife({ life: [] });
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([]);
  });

  it('the Event is trashed after use', () => {
    const g = upToLife();
    no(g, 'p1');
    expect(trash(g)).toEqual([ID]);
  });
});

describe('ST22-015 I Am Whitebeard!!: the Leader condition', () => {
  it('a Leader without a Whitebeard Pirates type: nothing is played and the "Then" part does not resolve', () => {
    const g = play(LB.luffy, [NEWGATE_VAN]);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([NEWGATE_VAN]);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([ID]);
  });

  it('a "Whitebeard Pirates" Leader of another card (OP02-001) satisfies the condition too', () => {
    const g = play(LB.wbp, [NEWGATE_VAN]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([NEWGATE_VAN]);
    expect(toMyNextMain).toBeTypeOf('function');
    expect(no).toBeTypeOf('function');
  });
});
