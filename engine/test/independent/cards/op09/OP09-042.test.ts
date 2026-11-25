/**
 * OP09-042 Buggy (Leader, Blue, 5000, 5 Life, {The Four Emperors}/{Cross Guild}).
 *
 * Card text: "[Activate: Main] You may rest 5 of your DON!! cards and trash 1 card from your hand:
 * Play up to 1 "Cross Guild" type Character card from your hand."
 *
 * Rules: the text before the colon is the cost (CR 8-3, 8-3-1-3: a cost that cannot be paid in full
 * is not paid, so the effect is not offered); resting needs ACTIVE DON!! (CR 6-5-5, 4-3); the trash
 * cost is chosen by the player and is paid before the effect, so the card trashed cannot also be
 * the card played; a Character played by an effect pays no cost (CR 8-1-1 / "play" without paying);
 * "up to 1" may be 0 (CR 8-4-4-1); there is no [Once Per Turn] on this text.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  chars,
  don,
  hand,
  kind,
  L9,
  mine,
  need,
  n,
  none,
  offeredAbilities,
  offeredIds,
  payHand,
  pickCards,
  S9,
  trash,
} from './kit-op09a.ts';

const BUGGY = 'OP09-042';
const ALVIDA = 'OP09-043'; // Blue, cost 5, 6000, {Cross Guild}; has an [On K.O.] only
const SH_VANILLA = S9.c5; // Red, cost 5, 7000, no Cross Guild type

function board(handCards: string[], costArea = { active: 10, rested: 0 }, extra = {}): TestGame {
  return mine(BUGGY, { hand: handCards, costArea, ...extra }, {}, L9.luffy);
}

/** Activate and pay: rest 5 DON!!, trash `fodder`. Leaves the "play up to 1" question pending. */
function activateAndPay(g: TestGame, fodder: string): void {
  const l = g.leader('p1');
  const [ability] = offeredAbilities(g, l);
  act(g, { type: 'activate', card: l, ability: ability! });
  need(g, 'choose', 'p1');
  payHand(g, [fodder]);
}

describe('OP09-042 Buggy: [Activate: Main] rest 5 DON!! + trash 1: play up to 1 {Cross Guild} Character from hand', () => {
  it('rests 5 DON!!, trashes the chosen card, and plays the chosen {Cross Guild} Character for free', () => {
    const g = board([S9.mr1, S9.c2]);
    activateAndPay(g, S9.c2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.mr1]);
    pickCards(g, [S9.mr1]);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([S9.mr1]);
    expect(trash(g)).toEqual([S9.c2]);
    expect(hand(g)).toEqual([]);
    // 5 rested by the cost; Mr.1 (cost 5) is not paid for.
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('the cost needs 5 ACTIVE DON!!: with 4 active (6 rested) the activation is not offered', () => {
    const g = board([S9.mr1, S9.c2], { active: 4, rested: 6 });
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('boundary: exactly 5 active DON!! is enough (the rest may already be rested)', () => {
    const g = board([S9.mr1, S9.c2], { active: 5, rested: 5 });
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
    activateAndPay(g, S9.c2);
    pickCards(g, [S9.mr1]);
    expect(chars(g)).toEqual([S9.mr1]);
    expect(don(g)).toMatchObject({ active: 0, rested: 10 });
  });

  it('with an empty hand the trash cost cannot be paid: not offered', () => {
    const g = board([]);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('only {Cross Guild} Characters are offered; other cards of the hand are not', () => {
    const g = board([S9.mr1, SH_VANILLA, ALVIDA, S9.c2]);
    activateAndPay(g, S9.c2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ALVIDA, S9.mr1].sort());
  });

  it('the trashed card is chosen by me and cannot be the one played; the trash cost may be a {Cross Guild} card', () => {
    const g = board([S9.mr1, ALVIDA]);
    activateAndPay(g, S9.mr1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ALVIDA]); // Mr.1 is already in the trash
    pickCards(g, [ALVIDA]);
    expect(chars(g)).toEqual([ALVIDA]);
    expect(trash(g)).toEqual([S9.mr1]);
  });

  it('trashing the only {Cross Guild} card as the cost leaves nothing to play: the question is empty and the cost stays paid', () => {
    const g = board([S9.mr1]);
    activateAndPay(g, S9.mr1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([S9.mr1]);
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('"up to 1": I may play nothing; the DON!! stay rested and the card stays trashed', () => {
    const g = board([S9.mr1, S9.c2]);
    activateAndPay(g, S9.c2);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([S9.mr1]);
    expect(trash(g)).toEqual([S9.c2]);
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('no [Once Per Turn]: with 10 active DON!! and 2 spare cards it can be used twice in a turn', () => {
    const g = board([S9.mr1, ALVIDA, S9.c2, S9.c3]);
    activateAndPay(g, S9.c2);
    pickCards(g, [S9.mr1]);
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
    activateAndPay(g, S9.c3);
    pickCards(g, [ALVIDA]);
    expect(chars(g)).toEqual([ALVIDA, S9.mr1].sort());
    expect(don(g)).toMatchObject({ active: 0, rested: 10 });
    expect(n(g, 'p1', 'characters')).toBe(2);
  });

  it('a third use is impossible once the 10 DON!! are all rested', () => {
    const g = board([S9.mr1, ALVIDA, S9.c2, S9.c3, S9.c4]);
    activateAndPay(g, S9.c2);
    pickCards(g, [S9.mr1]);
    activateAndPay(g, S9.c3);
    pickCards(g, [ALVIDA]);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('the played Character arrives active but cannot attack this turn (no [Rush])', () => {
    const g = board([S9.mr1, S9.c2]);
    activateAndPay(g, S9.c2);
    pickCards(g, [S9.mr1]);
    const mr1 = at(g, 'p1', 'characters', S9.mr1);
    expect(g.card(mr1).rested).toBe(false);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === mr1)).toBe(false);
  });

  it('must not happen: no card is taken from the deck or Life, and the opponent is untouched', () => {
    const g = board([S9.mr1, S9.c2]);
    const deckBefore = g.zone('p1', 'deck').length;
    const p2Before = [g.zone('p2', 'hand').length, g.zone('p2', 'characters').length];
    activateAndPay(g, S9.c2);
    pickCards(g, [S9.mr1]);
    expect(g.zone('p1', 'deck')).toHaveLength(deckBefore);
    expect(g.life('p1')).toBe(4);
    expect([g.zone('p2', 'hand').length, g.zone('p2', 'characters').length]).toEqual(p2Before);
  });
});
