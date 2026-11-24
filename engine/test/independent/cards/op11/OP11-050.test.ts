/**
 * OP11-050 Gotti (Blue Character, cost 3, 4000, Counter +2000, {Firetank Pirates}).
 *
 * Card text: "[When Attacking] You may trash 1 {Firetank Pirates} type card from your hand: Return up to
 * 1 Character with a cost of 1 or less to the owner's hand or place it at the bottom of their deck."
 *
 * Rules: the trash is an optional cost (a {Firetank Pirates} card, exactly 1). Any Character of
 * either side with cost 1 or less may be chosen. The player picks "return to hand" or "bottom of
 * deck"; both go to the OWNER's zone. "Up to 1" may be none (the cost stays paid).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  C11,
  chars,
  deck,
  hand,
  kind,
  L11,
  mine,
  need,
  no,
  none,
  offeredIds,
  optionChoices,
  payHand,
  pickInst,
  playCard,
  trash,
  unusable,
  yes,
  act,
  decision,
} from './kit-op11b.ts';

const GOTTI = 'OP11-050';

/** Gotti attacks the opponent Leader; the [When Attacking] "use" question is pending. */
function swing(o: { hand: string[]; own?: string[]; opp?: string[] }) {
  const g = mine(
    L11.mono,
    { characters: [GOTTI, ...(o.own ?? [])], hand: o.hand },
    { characters: o.opp ?? [] },
  );
  attack(g, at(g, 'p1', 'characters', GOTTI), g.leader('p2'));
  return g;
}

/** Choose the mode whose label matches. */
function mode(g: ReturnType<typeof swing>, re: RegExp): void {
  const d = need(g, 'choose', 'p1');
  const opt = (d.options ?? []).find((o) => re.test(o.label));
  if (!opt) throw new Error(`no option matching ${re}: ${optionChoices(g)}`);
  act(g, { type: 'pick', choice: { option: opt.id } });
}

describe('OP11-050 Gotti: [When Attacking] trash a {Firetank Pirates}: return a cost-1-or-less Character to hand or bottom of deck', () => {
  it('"return to hand": an opposing cost-1 Character goes to its owner hand', () => {
    const g = swing({ hand: [C11.fire3], opp: [C11.shc1] });
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [C11.fire3]);
    mode(g, /hand/i);
    pickInst(g, [at(g, 'p2', 'characters', C11.shc1)]);
    expect(chars(g, 'p2')).toEqual([]);
    expect(hand(g, 'p2')).toEqual([C11.shc1]);
    expect(trash(g)).toEqual([C11.fire3]);
  });

  it('"bottom of deck": the Character goes to the bottom of its OWNER deck', () => {
    const g = swing({ hand: [C11.fire3], opp: [C11.shc1] });
    yes(g);
    payHand(g, [C11.fire3]);
    mode(g, /bottom/i);
    pickInst(g, [at(g, 'p2', 'characters', C11.shc1)]);
    expect(chars(g, 'p2')).toEqual([]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(deck(g, 'p2')).toHaveLength(16);
    expect(deck(g, 'p2')[15]).toBe(C11.shc1);
  });

  it('my own cost-1 Character may be chosen: it returns to MY hand', () => {
    const g = swing({ hand: [C11.fire3], own: [C11.c1], opp: [C11.shc1] });
    yes(g);
    payHand(g, [C11.fire3]);
    mode(g, /hand/i);
    pickInst(g, [at(g, 'p1', 'characters', C11.c1)]);
    expect(hand(g)).toEqual([C11.c1]);
    expect(chars(g, 'p2')).toEqual([C11.shc1]);
  });

  it('offers only Characters with cost 1 or less: cost 2 and Gotti himself (cost 3) are not offered', () => {
    const g = swing({ hand: [C11.fire3], own: [C11.c1, C11.c2], opp: [C11.shc1, C11.c2] });
    yes(g);
    payHand(g, [C11.fire3]);
    mode(g, /hand/i);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c1, C11.shc1].sort());
  });

  it('declining the cost: nothing is trashed or moved and the attack goes on', () => {
    const g = swing({ hand: [C11.fire3], opp: [C11.shc1] });
    need(g, 'optional', 'p1');
    no(g);
    expect(hand(g)).toEqual([C11.fire3]);
    expect(chars(g, 'p2')).toEqual([C11.shc1]);
    expect(kind(g)).toBe('block');
  });

  it('only {Firetank Pirates} cards are offered as the cost, and exactly 1 is trashed', () => {
    const g = swing({ hand: [C11.fire3, C11.fire5, C11.c3], opp: [C11.shc1] });
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.fire3, C11.fire5].sort());
    payHand(g, [C11.fire5]);
    expect(trash(g)).toEqual([C11.fire5]);
    expect(hand(g).sort()).toEqual([C11.fire3, C11.c3].sort());
  });

  it('with no {Firetank Pirates} card in hand the cost cannot be paid', () => {
    const g = swing({ hand: [C11.c3], opp: [C11.shc1] });
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(chars(g, 'p2')).toEqual([C11.shc1]);
    expect(hand(g)).toEqual([C11.c3]);
  });

  it('"up to 1": after paying, may choose no Character; the card stays trashed', () => {
    const g = swing({ hand: [C11.fire3], opp: [C11.shc1] });
    yes(g);
    payHand(g, [C11.fire3]);
    mode(g, /hand/i);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([C11.shc1]);
    expect(trash(g)).toEqual([C11.fire3]);
    expect(decision(g)?.kind).toBe('block');
  });

  it('it fires on attacking only: playing Gotti from hand asks nothing', () => {
    const g = mine(L11.mono, { hand: [GOTTI, C11.fire3] }, { characters: [C11.shc1] });
    playCard(g, GOTTI);
    expect(kind(g)).toBe('main');
    expect(chars(g, 'p2')).toEqual([C11.shc1]);
  });
});
