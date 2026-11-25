/**
 * ST20-005 Charlotte Linlin (Yellow Character, cost 6, 7000, no Counter, {The Four Emperors}/
 * {Big Mom Pirates}).
 * "[On Play] You may trash 1 card from your hand: Your opponent chooses one:
 *  - Your opponent trashes 2 cards from their hand.
 *  - Trash 1 card from the top of your opponent's Life cards."
 * Rules: the OPPONENT picks the mode; the cost is paid from my hidden hand and is offered even when
 * unpayable; a Life card trashed by an effect does not activate its [Trigger].
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  atMain,
  BLUE,
  cost,
  decision,
  hand,
  kind,
  LD,
  many,
  mine,
  need,
  no,
  offeredUnpayable,
  payHand,
  pickInst,
  playId,
  SC,
  trash,
  yes,
  inst,
} from './kit-st1821a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'ST20-005';
const OPP_HAND = [SC.c3, SC.c4, SC.c5];

function start(p1Hand: string[], p2: Partial<PlayerSpec> = {}) {
  return mine(
    LD.katakuri,
    { hand: [ID, ...p1Hand], ...cost(10) },
    { hand: OPP_HAND, life: many(BLUE, 4), ...p2 },
  );
}

/** Play Linlin, pay with `SC.c2`, and arrive at the opponent's mode question. */
function toMode(p2: Partial<PlayerSpec> = {}) {
  const g = start([SC.c2, SC.c1], p2);
  playId(g, ID);
  yes(g, 'p1');
  payHand(g, [SC.c2]);
  return g;
}

/** Option id whose label contains `word`. */
function option(g: TestGame, word: RegExp): string {
  const o = decision(g)?.options?.find((x) => word.test(x.label));
  if (!o) throw new Error('option not offered');
  return o.id;
}

describe('ST20-005 Charlotte Linlin: [On Play] trash 1 card: the opponent chooses to trash 2 cards or lose a Life', () => {
  it('after the cost, the OPPONENT is asked to choose between the two modes', () => {
    const g = toMode();
    need(g, 'choose', 'p2');
    expect(decision(g)?.options).toHaveLength(2);
    expect(trash(g)).toEqual([SC.c2]);
    expect(hand(g)).toEqual([SC.c1]);
  });

  it('mode 1: the opponent trashes 2 cards of their hand (their choice); Life is untouched', () => {
    const g = toMode();
    act(g, { type: 'pick', choice: { option: option(g, /hand/i) } });
    need(g, 'choose', 'p2');
    pickInst(g, [inst(g, 'p2', 'hand', SC.c3), inst(g, 'p2', 'hand', SC.c5)]);
    expect(atMain(g)).toBe(true);
    expect(trash(g, 'p2')).toEqual([SC.c3, SC.c5].sort());
    expect(hand(g, 'p2')).toEqual([SC.c4]);
    expect(g.life('p2')).toBe(4);
  });

  it('mode 2: the top card of the opponent Life is trashed; their hand is untouched', () => {
    const g = toMode();
    const top = g.zone('p2', 'life')[0]!.instance;
    act(g, { type: 'pick', choice: { option: option(g, /life/i) } });
    expect(atMain(g)).toBe(true);
    expect(g.life('p2')).toBe(3);
    expect(g.zone('p2', 'life').map((c) => c.instance)).not.toContain(top);
    expect(trash(g, 'p2')).toEqual([BLUE]);
    expect(hand(g, 'p2')).toEqual([...OPP_HAND].sort());
  });

  it('only one mode happens: choosing the Life mode does not also trash hand cards', () => {
    const g = toMode();
    act(g, { type: 'pick', choice: { option: option(g, /life/i) } });
    expect(kind(g)).toBe('main');
    expect(trash(g, 'p2')).toHaveLength(1);
  });

  it('a Life card trashed by this effect does not activate its [Trigger]', () => {
    const g = toMode({ life: [ID, BLUE, BLUE, BLUE] });
    act(g, { type: 'pick', choice: { option: option(g, /life/i) } });
    expect(kind(g)).not.toBe('trigger');
    expect(trash(g, 'p2')).toEqual([ID]);
  });

  it('declining the optional cost: nothing is trashed and the opponent is not asked anything', () => {
    const g = start([SC.c2]);
    playId(g, ID);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC.c2]);
    expect(trash(g, 'p2')).toEqual([]);
    expect(g.life('p2')).toBe(4);
  });

  it('with an empty hand the cost is offered but cannot be accepted (the hand is hidden)', () => {
    const g = start([]);
    playId(g, ID);
    offeredUnpayable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('exactly 1 card of mine is trashed as the cost, and Linlin stays on the field', () => {
    const g = toMode();
    act(g, { type: 'pick', choice: { option: option(g, /life/i) } });
    expect(trash(g)).toEqual([SC.c2]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('with an opponent hand of 2 or more the hand mode trashes exactly 2, not 3', () => {
    const g = toMode();
    act(g, { type: 'pick', choice: { option: option(g, /hand/i) } });
    pickInst(g, [inst(g, 'p2', 'hand', SC.c3), inst(g, 'p2', 'hand', SC.c4)]);
    expect(hand(g, 'p2')).toHaveLength(1);
    expect(trash(g, 'p2')).toHaveLength(2);
  });
});
