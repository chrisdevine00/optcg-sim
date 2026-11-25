/**
 * EB02-046 Hildon (Black Character, cost 3, 3000, Counter +2000, {Thriller Bark Pirates}).
 *
 * Card text: "[On Play] Trash 2 cards from the top of your deck and give up to 1 of your opponent's
 * Characters -1 cost during this turn."
 *
 * Rules: the top 2 cards of the own deck go to the trash (mandatory); "up to 1" of the OPPONENT's
 * Characters (not the Leader, not an own Character) gets -1 cost until the end of the turn; the cost
 * used by rules and effects is the modified one, never below 0 outside a calculation (CR 1-3-6-2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  chars,
  deck,
  kind,
  LE,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SE,
  trash,
  toMyNextMain,
  skipEmptyPick,
  useAbility,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const HILDON = 'EB02-046';

function start(o: { deck?: string[]; opp?: string[]; own?: string[] } = {}) {
  const g = mine(
    LE.luffy,
    { hand: [HILDON], characters: o.own ?? [], ...(o.deck ? { deck: o.deck } : {}) },
    { characters: o.opp ?? [] },
  );
  playRaw(g, HILDON);
  return g;
}

describe('EB02-046 Hildon: printed values', () => {
  it('cost 3, 3000 power, Counter +2000', () => {
    const g = mine(LE.luffy, { characters: [HILDON] });
    const h = ch(g, 'p1', HILDON);
    expect(g.card(h).cost).toBe(3);
    expect(g.power(h)).toBe(3000);
    expect(g.card(h).counter).toBe(2000);
  });
});

describe('EB02-046 Hildon: [On Play] trash 2 from the top of the deck and give an opposing Character -1 cost', () => {
  const D = [SE.sai, SE.marco, SE.kingdew, ...Array(10).fill(SE.mohji)];

  it('trashes exactly the top 2 cards of the deck', () => {
    const g = start({ deck: D });
    skipEmptyPick(g);
    expect(trash(g)).toEqual([SE.sai, SE.marco].sort());
    expect(deck(g)[0]).toBe(SE.kingdew);
    expect(deck(g)).toHaveLength(11);
  });

  it('the opposing Character gets -1 cost (4 becomes 3)', () => {
    const g = start({ deck: D, opp: [SE.hajrudin] });
    const target = ch(g, 'p2', SE.hajrudin);
    pickCards(g, [SE.hajrudin]);
    expect(g.card(target).cost).toBe(3);
  });

  it("offers only the opponent's Characters: not an own Character, not a Leader", () => {
    const g = start({ deck: D, opp: [SE.hajrudin, SE.marco], own: [SE.sai] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.hajrudin, SE.marco].sort());
    pickCards(g, [SE.marco]);
    expect(g.card(ch(g, 'p2', SE.marco)).cost).toBe(2);
    expect(g.card(ch(g, 'p2', SE.hajrudin)).cost).toBe(4);
    expect(g.card(ch(g, 'p1', SE.sai)).cost).toBe(2);
  });

  it('"up to 1": may give the cost reduction to nothing; the 2 cards are still trashed', () => {
    const g = start({ deck: D, opp: [SE.hajrudin] });
    none(g);
    expect(g.card(ch(g, 'p2', SE.hajrudin)).cost).toBe(4);
    expect(trash(g)).toEqual([SE.sai, SE.marco].sort());
  });

  it('gives the reduction to at most 1 Character', () => {
    const g = start({ deck: D, opp: [SE.hajrudin, SE.marco] });
    pickCards(g, [SE.hajrudin]);
    expect(kind(g)).toBe('main');
    expect(g.card(ch(g, 'p2', SE.marco)).cost).toBe(3);
  });

  it('with no opposing Character the 2 cards are still trashed and nothing else happens', () => {
    const g = start({ deck: D });
    skipEmptyPick(g);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([SE.sai, SE.marco].sort());
  });

  it('a cost 1 Character goes to cost 0 and not below (a negative cost is treated as 0)', () => {
    const g = start({ deck: D, opp: [SE.komachiyo] });
    pickCards(g, [SE.komachiyo]);
    expect(g.card(ch(g, 'p2', SE.komachiyo)).cost).toBe(0);
  });

  it('the reduction lasts "during this turn": it is gone on the opponent\'s turn', () => {
    const g = start({ deck: D, opp: [SE.hajrudin] });
    const target = ch(g, 'p2', SE.hajrudin);
    pickCards(g, [SE.hajrudin]);
    expect(g.card(target).cost).toBe(3);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(target).cost).toBe(4);
  });

  it('must not: the reduction is not a power change and Hildon stays on the field', () => {
    const g = start({ deck: D, opp: [SE.hajrudin] });
    const target = ch(g, 'p2', SE.hajrudin);
    pickCards(g, [SE.hajrudin]);
    expect(g.power(target)).toBe(6000);
    expect(chars(g)).toEqual([HILDON]);
  });

  it('the cost reduction is gone after a whole turn cycle', () => {
    const g = start({ deck: D, opp: [SE.hajrudin] });
    const target = ch(g, 'p2', SE.hajrudin);
    pickCards(g, [SE.hajrudin]);
    toMyNextMain(g);
    expect(g.card(target).cost).toBe(4);
  });

  it('the reduced cost is the cost other effects see: a cost 2 Character at -1 becomes a legal target of a cost-1-or-less K.O. (EB02-049 Garp)', () => {
    const g = mine(
      LE.garp,
      { hand: [HILDON], characters: ['EB02-049'], deck: D },
      { characters: [SE.sai] },
    );
    playRaw(g, HILDON);
    pickCards(g, [SE.sai]);
    expect(g.card(ch(g, 'p2', SE.sai)).cost).toBe(1);
    useAbility(g, ch(g, 'p1', 'EB02-049'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.sai]);
    pickCards(g, [SE.sai]);
    expect(chars(g, 'p2')).toEqual([]);
  });
});
