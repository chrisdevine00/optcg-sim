/**
 * OP14-045 Kuroobi (Character, Blue, cost 3, 3000, Counter +1000, {Fish-Man}/{The Sun Pirates}).
 *
 * Card text: "When a card is trashed from your hand by an effect, this Character gains [Rush] during
 * this turn. (This card can attack on the turn in which it is played.)
 * [On K.O.] Draw 1 card."
 *
 * The hand trash is caused by OP16-093 Bartholomew Kuma ([On Play] Draw 2 cards and trash 2 cards
 * from your hand), an effect that is not a cost.
 *
 * Rules: CR 10-1-1-1 ([Rush]), CR 3-7-4 (a Character cannot attack the turn it is played), CR 10-2-1
 * (K.O.). Open reading (M6b-Q31): whether a cost paid from the hand counts as "by an effect"; the
 * tests use an effect that is not a cost.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  C14,
  canAttackAnything,
  canHit,
  deck,
  hand,
  inst,
  kw,
  L14,
  mine,
  need,
  noDefence,
  opponentKOs,
  rested,
  S14,
  theirs,
  toMyNextMain,
  trash,
  trashByKuma,
} from './kit-op14b.ts';

const KURO = 'OP14-045';
const KUMA = 'OP16-093';
const FRESH = (card: string) => ({ card, playedThisTurn: true });

function start(chars: (string | { card: string; playedThisTurn: boolean })[]) {
  return mine(
    L14.luffy,
    { hand: [KUMA, C14.sai, C14.marco], characters: chars, deck: [BLUE, BLUE, BLUE, BLUE] },
    {},
  );
}

describe('OP14-045 Kuroobi: gains [Rush] this turn when a card is trashed from your hand by an effect; [On K.O.] draw 1', () => {
  it('control: played this turn it cannot attack and has no [Rush]', () => {
    const g = start([FRESH(KURO)]);
    const k = inst(g, 'p1', 'characters', KURO);
    expect(kw(g, k)).not.toContain('Rush');
    expect(canAttackAnything(g, k)).toBe(false);
  });

  it('a card trashed from your hand by an effect gives it [Rush]: it can attack the Leader the turn it was played', () => {
    const g = start([FRESH(KURO)]);
    trashByKuma(g, [C14.sai, C14.marco]);
    const k = inst(g, 'p1', 'characters', KURO);
    expect(kw(g, k)).toContain('Rush');
    expect(canHit(g, k, g.leader('p2'))).toBe(true);
    attack(g, k, g.leader('p2'));
    noDefence(g);
    expect(rested(g, k)).toBe(true);
    expect(atMain(g)).toBe(true);
  });

  it('only this Character gains [Rush]: another Character played this turn still cannot attack', () => {
    const g = start([FRESH(KURO), FRESH(C14.camie)]);
    trashByKuma(g, [C14.sai, C14.marco]);
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', C14.camie))).toBe(false);
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', KURO))).toBe(true);
  });

  it('two Kuroobi on the field both gain [Rush]', () => {
    const g = start([FRESH(KURO), FRESH(KURO)]);
    trashByKuma(g, [C14.sai, C14.marco]);
    expect(kw(g, inst(g, 'p1', 'characters', KURO, 0))).toContain('Rush');
    expect(kw(g, inst(g, 'p1', 'characters', KURO, 1))).toContain('Rush');
  });

  it('the [Rush] lasts for this turn only: it is gone at my next Main Phase', () => {
    const g = start([FRESH(KURO)]);
    trashByKuma(g, [C14.sai, C14.marco]);
    expect(kw(g, inst(g, 'p1', 'characters', KURO))).toContain('Rush');
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(kw(g, inst(g, 'p1', 'characters', KURO))).not.toContain('Rush');
  });

  it("must not trigger when the opponent's hand is trashed (only a card from YOUR hand counts)", () => {
    const g = theirs(
      L14.luffy,
      { characters: [KURO] },
      { hand: [KUMA, C14.sai, C14.marco], deck: [BLUE, BLUE, BLUE, BLUE] },
    );
    trashByKuma(g, [C14.sai, C14.marco], 'p2');
    expect(kw(g, inst(g, 'p1', 'characters', KURO))).not.toContain('Rush');
  });

  it('the trash really happened: both cards are in the trash and the other hand cards stay', () => {
    const g = start([FRESH(KURO)]);
    trashByKuma(g, [C14.sai, C14.marco]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([C14.marco, C14.sai].sort());
    expect(hand(g)).toEqual([BLUE, BLUE]);
  });

  it("[On K.O.] K.O.'d by an opposing effect (Gum-Gum Lightning): draws 1", () => {
    const g = theirs(
      L14.luffy,
      { characters: [KURO], deck: [C14.kingdew, BLUE, BLUE] },
      { hand: [S14.lightning] },
    );
    opponentKOs(g, inst(g, 'p1', 'characters', KURO));
    expect(trash(g)).toEqual([KURO]);
    expect(hand(g)).toEqual([C14.kingdew]);
  });

  it("[On K.O.] K.O.'d in battle: draws 1", () => {
    const g = theirs(
      L14.luffy,
      { characters: [{ card: KURO, rested: true }], deck: [C14.kingdew, BLUE, BLUE] },
      {},
    );
    attack(g, g.leader('p2'), inst(g, 'p1', 'characters', KURO));
    noDefence(g);
    expect(trash(g)).toEqual([KURO]);
    expect(hand(g)).toEqual([C14.kingdew]);
    expect(deck(g)).toHaveLength(2);
    expect(rested(g, g.leader('p2'))).toBe(true);
  });

  it("[On K.O.] does not draw when it is not K.O.'d (it simply attacks and survives)", () => {
    const g = start([FRESH(KURO)]);
    trashByKuma(g, [C14.sai, C14.marco]);
    attack(g, inst(g, 'p1', 'characters', KURO), g.leader('p2'));
    noDefence(g);
    expect(hand(g)).toEqual([BLUE, BLUE]);
  });
});
