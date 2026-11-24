/**
 * OP12-053 Borsalino (Character, Blue, cost 4, 5000, Counter +1000, {Navy}).
 *
 * Card text: "[Once Per Turn] If this Character would be removed from the field by your opponent's
 * effect, you may trash 1 card from your hand instead. [Opponent's Turn] If your Leader has the
 * "Navy" type, this Character gains [Blocker] and +1000 power."
 *
 * Rules: a replacement effect (CR 8-1-3-4): optional ("may"), needs a card to trash (CR 8-1-3-4-5),
 * once per turn; it covers removal by the opponent's EFFECT only, not battle. [Opponent's Turn]
 * means during the opponent's turn only; the Leader's type is read live.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  cast,
  chars,
  hand,
  kind,
  kw,
  LB,
  mine,
  need,
  noDefence,
  opponentKOs,
  pickInst,
  SB,
  theirs,
  trash,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BORSALINO = 'OP12-053';
const LIGHTNING = 'OP09-077';
/** OP11-061 Gum-Gum Jet Culverin: Event, cost 3. [Main] Place up to 1 of your opponent's Characters with a base cost of 4 or less at the bottom of the owner's deck. */
const CULVERIN = 'OP11-061';

function offerAccepted(g: TestGame): void {
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: true });
  if (kind(g) === 'choose') pickInst(g, [g.find('p1', 'hand', SB.sai)]);
}

/** p2's turn; p1 (Navy Leader unless given) has Borsalino and Sai in hand; p2 holds `p2hand`. */
function board(p2hand: string[], leader: string = LB.navy, h: string[] = [SB.sai]): TestGame {
  return theirs(leader, { characters: [BORSALINO], hand: h }, { hand: p2hand });
}

describe("OP12-053 Borsalino: [Once Per Turn] trash 1 instead of removal by their effect; [Opponent's Turn] Navy Leader: [Blocker] +1000", () => {
  it('K.O. by an opponent effect: offered; accept trashes 1 card and Borsalino stays', () => {
    const g = board([LIGHTNING]);
    opponentKOs(g, g.find('p1', 'characters', BORSALINO));
    offerAccepted(g);
    expect(chars(g)).toEqual([BORSALINO]);
    expect(trash(g)).toEqual([SB.sai]);
    expect(hand(g)).toEqual([]);
  });

  it('declining: Borsalino is K.O.d and the hand is untouched', () => {
    const g = board([LIGHTNING]);
    opponentKOs(g, g.find('p1', 'characters', BORSALINO));
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([BORSALINO]);
    expect(hand(g)).toEqual([SB.sai]);
  });

  it('also replaces a non-K.O. removal: placed at the bottom of the deck (Gum-Gum Jet Culverin)', () => {
    const g = board([CULVERIN]);
    cast(g, CULVERIN);
    pickInst(g, [g.find('p1', 'characters', BORSALINO)]);
    offerAccepted(g);
    expect(chars(g)).toEqual([BORSALINO]);
    expect(trash(g)).toEqual([SB.sai]);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
  });

  it('[Once Per Turn]: a second removal in the same turn is not replaced', () => {
    const g = board([LIGHTNING, LIGHTNING], LB.navy, [SB.sai, SB.marco]);
    opponentKOs(g, g.find('p1', 'characters', BORSALINO));
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    if (kind(g) === 'choose') pickInst(g, [g.find('p1', 'hand', SB.sai)]);
    expect(chars(g)).toEqual([BORSALINO]);
    need(g, 'main', 'p2');
    opponentKOs(g, g.find('p1', 'characters', BORSALINO));
    // Spent: no offer, Borsalino is K.O.d, the hand keeps its card.
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SB.marco]);
  });

  it('unpayable (empty hand): the replacement cannot be used and the K.O. happens', () => {
    const g = board([LIGHTNING], LB.navy, []);
    opponentKOs(g, g.find('p1', 'characters', BORSALINO));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([BORSALINO]);
  });

  it('must not: a battle K.O. is not an effect: no offer, Borsalino is K.O.d', () => {
    const g = theirs(
      LB.navy,
      { characters: [{ card: BORSALINO, rested: true }], hand: [SB.sai] },
      { characters: [SB.oars] },
    );
    attack(g, g.find('p2', 'characters', SB.oars), g.find('p1', 'characters', BORSALINO));
    noDefence(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SB.sai]);
  });

  it("[Opponent's Turn] with a {Navy} Leader: gains [Blocker] and +1000 power (6000)", () => {
    const g = board([]);
    const b = g.find('p1', 'characters', BORSALINO);
    expect(kw(g, b)).toContain('Blocker');
    expect(g.power(b)).toBe(6000);
  });

  it('must not: with a non-{Navy} Leader there is no [Blocker] and no power bonus', () => {
    const g = board([], LB.croc);
    const b = g.find('p1', 'characters', BORSALINO);
    expect(kw(g, b)).not.toContain('Blocker');
    expect(g.power(b)).toBe(5000);
  });

  it('must not: on my own turn the bonuses are off (5000, no [Blocker]) even with a {Navy} Leader', () => {
    const g = mine(LB.navy, { characters: [BORSALINO] });
    const b = g.find('p1', 'characters', BORSALINO);
    expect(kw(g, b)).not.toContain('Blocker');
    expect(g.power(b)).toBe(5000);
  });

  it('the granted [Blocker] works: it can block an attack on my Leader on their turn', () => {
    const g = theirs(LB.navy, { characters: [BORSALINO] }, { characters: [SB.hajrudin] });
    attack(g, g.find('p2', 'characters', SB.hajrudin), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([g.find('p1', 'characters', BORSALINO)]);
  });
});
