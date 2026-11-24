/**
 * OP12-060 Boeuf Burst (Event, Blue, cost 3, {Straw Hat Crew}).
 *
 * Card text: "[Main] If your Leader is multicolored, choose one: • Return up to 1 of your opponent's
 * Characters with a cost of 4 or less to the owner's hand. • If you have 6 or less cards in your
 * hand, draw 2 cards."
 *
 * Rules: "multicolored" is a Leader with two colors; a one-color Leader fails the condition and
 * nothing happens. Exactly one mode is carried out. An Event is trashed when played (rules-digest
 * 74), so the card is already out of my hand when "6 or less cards in your hand" is counted: 6
 * other cards qualify, 7 do not. "Up to 1" may be none; the cost limit reads the current cost.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  cast,
  chars,
  deck,
  don,
  hand,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  optionChoices,
  pickInst,
  SB,
  trash,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BOEUF = 'OP12-060';
const rest = (n: number) => Array.from({ length: n }, () => SB.mohji);

function mode(g: TestGame, id: '0' | '1'): void {
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: { option: id } });
}

describe('OP12-060 Boeuf Burst: multicolored Leader, choose one: return a cost 4 or less Character / draw 2 with 6 or less in hand', () => {
  it('offers two modes with a multicolored Leader', () => {
    const g = mine(LB.sanjiDon, { hand: [BOEUF] }, { characters: [SB.hajrudin] });
    cast(g, BOEUF);
    need(g, 'choose', 'p1');
    expect(optionChoices(g)).toHaveLength(2);
    expect(don(g).active).toBe(7);
  });

  it('mode "return": the chosen cost 4 Character goes to its owner\'s hand; no card is drawn', () => {
    const g = mine(
      LB.sanjiDon,
      { hand: [BOEUF], deck: [SB.marco, ...rest(14)] },
      { characters: [SB.hajrudin, SB.kingdew] },
    );
    cast(g, BOEUF);
    mode(g, '0');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.hajrudin]);
    pickInst(g, [g.find('p2', 'characters', SB.hajrudin)]);
    expect(chars(g, 'p2')).toEqual([SB.kingdew]);
    expect(hand(g, 'p2')).toEqual([SB.hajrudin]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([BOEUF]);
  });

  it('mode "return" boundary: a cost 5 Character is not offered; "up to 1" lets me pick none', () => {
    const g = mine(LB.sanjiDon, { hand: [BOEUF] }, { characters: [SB.kingdew] });
    cast(g, BOEUF);
    mode(g, '0');
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([SB.kingdew]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('mode "return" may be answered with nothing even when a Character qualifies', () => {
    const g = mine(LB.sanjiDon, { hand: [BOEUF] }, { characters: [SB.hajrudin] });
    cast(g, BOEUF);
    mode(g, '0');
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([SB.hajrudin]);
  });

  it('mode "draw" with 6 other cards in hand (6 left after the Event): draws 2', () => {
    const g = mine(LB.sanjiDon, {
      hand: [BOEUF, ...rest(6)],
      deck: [SB.marco, SB.sai, ...rest(13)],
    });
    cast(g, BOEUF);
    mode(g, '1');
    expect(hand(g)).toHaveLength(8);
    expect(hand(g)).toContain(SB.marco);
    expect(hand(g)).toContain(SB.sai);
    expect(deck(g)).toHaveLength(13);
  });

  it('mode "draw" boundary: 7 other cards in hand: nothing is drawn', () => {
    const g = mine(LB.sanjiDon, {
      hand: [BOEUF, ...rest(7)],
      deck: [SB.marco, SB.sai, ...rest(13)],
    });
    cast(g, BOEUF);
    mode(g, '1');
    expect(hand(g)).toHaveLength(7);
    expect(deck(g)).toHaveLength(15);
  });

  it('only the chosen mode is carried out: choosing "draw" returns nothing even when a target exists', () => {
    const g = mine(LB.sanjiDon, { hand: [BOEUF] }, { characters: [SB.hajrudin] });
    cast(g, BOEUF);
    mode(g, '1');
    expect(hand(g)).toHaveLength(2);
    expect(chars(g, 'p2')).toEqual([SB.hajrudin]);
  });

  it('must not: a Leader with one color does nothing (no mode asked, nothing returned or drawn)', () => {
    const g = mine(LB.croc, { hand: [BOEUF] }, { characters: [SB.hajrudin] });
    cast(g, BOEUF);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
    expect(chars(g, 'p2')).toEqual([SB.hajrudin]);
    expect(trash(g)).toEqual([BOEUF]);
  });

  it('another multicolored Leader (P-076, Blue/Black) works as well', () => {
    const g = mine(LB.navy, { hand: [BOEUF] }, { characters: [SB.hajrudin] });
    cast(g, BOEUF);
    need(g, 'choose', 'p1');
    expect(optionChoices(g)).toHaveLength(2);
  });
});
