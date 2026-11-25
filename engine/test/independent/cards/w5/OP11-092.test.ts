/**
 * OP11-092 Helmeppo (Character, Black, cost 6, 7000, no Counter, {Navy}/{SWORD}, Slash).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Draw 1 card and play up to 1 "SWORD" type
 * Character card with a cost of 8 or less other than [Helmeppo] from your trash. Then, place the 1
 * Character played by this effect at the bottom of the owner's deck at the end of this turn."
 *
 * Rules: the trash is a cost paid first, so the trashed card can itself be played; "up to 1" may be
 * skipped; "other than [Helmeppo]" is by name (EB04-047 is also a Helmeppo); a quoted type in the
 * data is an exact type (DECISIONS 2026-11-25); an optional cost paid from the hidden hand is
 * offered even when unpayable, with "use" illegal; a card played by an effect is placed on the field
 * and its [On Play] fires.
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import {
  at,
  atMain,
  chars,
  deck,
  hand,
  LW,
  mine,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickCards,
  playRaw,
  settleOrders,
  trash,
  V13,
  yes,
  type Spec,
} from './kit-w5b.ts';

const HELM = 'OP11-092';
/** OP11-017 X.Drake: Red, cost 6, 7000, {Navy}/{SWORD}, vanilla. */
const DRAKE = 'OP11-017';
/** OP11-119 Koby: Black, cost 8, 9000, {Navy}/{SWORD}; its [On Play] asks for a pick. */
const KOBY8 = 'OP11-119';
/** EB04-047 Helmeppo: Black, cost 3, 3000, {Navy}/{SWORD}: another card named Helmeppo. */
const HELM3 = 'EB04-047';
/** OP11-013 Prince Grus: Red, cost 1, 2000, {Navy}/{SWORD}; only a [When Attacking]. */
const GRUS = 'OP11-013';
/** OP11-005 Smoker: Red, cost 4, 5000, {Navy} but not {SWORD}. */
const SMOKER = 'OP11-005';

function board(over: Spec = {}) {
  return mine(LW.luffy, {
    hand: [HELM, V13.sai],
    trash: [DRAKE, GRUS, HELM3, SMOKER, V13.marco],
    deck: [V13.hajrudin, V13.kingdew, V13.thatch, V13.mohji],
    ...over,
  });
}

/** Play Helmeppo, accept, trash `pay`; stops at the "play from trash" pick. */
function start(g: ReturnType<typeof board>, pay: string = V13.sai) {
  playRaw(g, HELM);
  yes(g, 'p1');
  payHand(g, [pay]);
}

function endMyTurn(g: ReturnType<typeof board>) {
  act(g, { type: 'endTurn' });
  settleOrders(g, 'p1');
  need(g, 'main', 'p2');
}

describe('OP11-092 Helmeppo: [On Play] trash 1, draw 1, play a SWORD cost 8 or less from the trash, bottom of the deck at the end of the turn', () => {
  it('printed values: cost 6, 7000 power, no Counter', () => {
    const g = board();
    const c = g.card(at(g, 'p1', 'hand', HELM));
    expect(c.cost).toBe(6);
    playRaw(g, HELM);
    need(g, 'optional', 'p1');
    expect(g.power(at(g, 'p1', 'characters', HELM))).toBe(7000);
    expect(g.card(at(g, 'p1', 'characters', HELM)).counter ?? null).toBeNull();
  });

  it('pays the trash, draws 1, then offers only {SWORD} Characters of cost 8 or less other than [Helmeppo]', () => {
    const g = board();
    start(g);
    expect(hand(g)).toEqual([V13.hajrudin]);
    expect(trash(g)).toContain(V13.sai);
    need(g, 'choose', 'p1');
    // Drake (6), Grus (1): SWORD. Not the other Helmeppo (name), Smoker (Navy only), Marco, Sai.
    expect(offeredIds(g)).toEqual([DRAKE, GRUS].sort());
  });

  it('a played card stays on the field for the rest of my turn and goes to the bottom of my deck at its end', () => {
    const g = board();
    start(g);
    pickCards(g, [DRAKE]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p1').sort()).toEqual([DRAKE, HELM].sort());
    expect(trash(g)).not.toContain(DRAKE);
    const before = deck(g).length;
    endMyTurn(g);
    expect(chars(g, 'p1')).toEqual([HELM]);
    expect(deck(g)).toHaveLength(before + 1);
    expect(deck(g).at(-1)).toBe(DRAKE);
  });

  it('boundary: a cost 8 SWORD is offered (the limit is "8 or less")', () => {
    const g = board({ trash: [KOBY8, DRAKE, V13.marco] });
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DRAKE, KOBY8].sort());
  });

  it('"up to 1": may play nothing; then nothing is placed at the bottom at the end of the turn', () => {
    const g = board();
    start(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p1')).toEqual([HELM]);
    const before = deck(g).length;
    endMyTurn(g);
    expect(deck(g)).toHaveLength(before);
    expect(deck(g).at(-1)).not.toBe(DRAKE);
  });

  it('declining the "you may" trash does nothing: no draw, no play, Sai stays in hand', () => {
    const g = board();
    playRaw(g, HELM);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([V13.sai]);
    expect(deck(g)).toHaveLength(4);
    expect(trash(g)).not.toContain(V13.sai);
  });

  it('with no card left in hand the cost is offered but cannot be used', () => {
    const g = board({ hand: [HELM] });
    playRaw(g, HELM);
    const d = decision(g);
    expect(d?.kind).toBe('optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    act(g, { type: 'optional', accept: false });
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(4);
  });

  it('the trashed card counts: a {SWORD} card trashed as the cost can be played from the trash', () => {
    const g = board({ hand: [HELM, DRAKE], trash: [V13.marco] });
    start(g, DRAKE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DRAKE]);
    pickCards(g, [DRAKE]);
    expect(chars(g, 'p1').sort()).toEqual([DRAKE, HELM].sort());
  });

  it('with no {SWORD} Character in the trash the draw still happens and nothing is played', () => {
    const g = board({ trash: [SMOKER, HELM3, V13.marco] });
    start(g);
    if (decision(g)?.kind === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([V13.hajrudin]);
    expect(chars(g, 'p1')).toEqual([HELM]);
  });

  it('must not: the other [Helmeppo] and a non-{SWORD} Navy card are never playable, and Helmeppo herself is not bottomed', () => {
    const g = board({ trash: [HELM3, SMOKER, DRAKE] });
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DRAKE]);
    pickCards(g, [DRAKE]);
    endMyTurn(g);
    expect(chars(g, 'p1')).toEqual([HELM]);
    expect(trash(g)).toContain(HELM3);
    expect(trash(g)).toContain(SMOKER);
  });

  it('the Character is played, not just moved: its own [On Play] fires (Koby 8 asks for its pick)', () => {
    const g = board({ trash: [KOBY8, V13.marco] });
    start(g);
    pickCards(g, [KOBY8]);
    const d = need(g, 'choose', 'p1');
    expect(d.prompt).toMatch(/Koby/);
  });
});
