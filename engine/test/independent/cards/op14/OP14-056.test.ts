/**
 * OP14-056 Wadatsumi (Character, Blue, cost 3, 5000, Counter +2000, {Fish-Man}/{The Sun Pirates}).
 *
 * Card text: "This Character cannot attack.
 * When a card is trashed from your hand by an effect, this Character's effect is negated during this
 * turn."
 *
 * The hand trash is caused by OP16-093 Bartholomew Kuma ([On Play] Draw 2 cards and trash 2 cards
 * from your hand), an effect that is not a cost (M6b-Q31 leaves costs open).
 *
 * Rules: CR 7-1-1 (an attack needs an attacker that can attack), CR 3-7-4, CR 10-1-1-1.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  activate,
  BLUE,
  C14,
  canAttackAnything,
  canHit,
  choose,
  inst,
  L14,
  mine,
  need,
  noDefence,
  rested,
  toMyNextMain,
  trashByKuma,
  attackers,
} from './kit-op14b.ts';

const WADA = 'OP14-056';
const KUMA = 'OP16-093';

function start(chars: (string | { card: string; playedThisTurn?: boolean; rested?: boolean })[]) {
  return mine(
    L14.luffy,
    { hand: [KUMA, C14.sai, C14.marco], characters: chars, deck: [BLUE, BLUE, BLUE, BLUE] },
    { characters: [{ card: C14.marco, rested: true }] },
  );
}

describe('OP14-056 Wadatsumi: cannot attack; negated this turn when a card is trashed from your hand by an effect', () => {
  it('cannot attack the Leader or a rested Character, although other Characters can', () => {
    const g = start([WADA, C14.sai]);
    const w = inst(g, 'p1', 'characters', WADA);
    expect(canAttackAnything(g, w)).toBe(false);
    expect(canHit(g, w, g.leader('p2'))).toBe(false);
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', C14.sai))).toBe(true);
    expect(attackers(g)).not.toContain(w);
  });

  it('a card trashed from my hand by an effect negates it: it can then attack', () => {
    const g = start([WADA]);
    const w = inst(g, 'p1', 'characters', WADA);
    trashByKuma(g, [C14.sai, C14.marco]);
    need(g, 'main', 'p1');
    expect(canHit(g, w, g.leader('p2'))).toBe(true);
    expect(canHit(g, w, inst(g, 'p2', 'characters', C14.marco))).toBe(true);
  });

  it('the attack then resolves normally (5000 against a 5000 Leader wins and deals 1 damage)', () => {
    const g = start([WADA]);
    const w = inst(g, 'p1', 'characters', WADA);
    trashByKuma(g, [C14.sai, C14.marco]);
    attack(g, w, g.leader('p2'));
    noDefence(g);
    expect(rested(g, w)).toBe(true);
    expect(g.life('p2')).toBe(3);
  });

  it('the negation lasts this turn only: at my next Main Phase it cannot attack again', () => {
    const g = start([WADA]);
    const w = inst(g, 'p1', 'characters', WADA);
    trashByKuma(g, [C14.sai, C14.marco]);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(canAttackAnything(g, w)).toBe(false);
  });

  it('the negation is not permanent: before the trash it cannot attack, after it can', () => {
    const g = start([WADA]);
    const w = inst(g, 'p1', 'characters', WADA);
    expect(canAttackAnything(g, w)).toBe(false);
    trashByKuma(g, [C14.sai, C14.marco]);
    expect(canAttackAnything(g, w)).toBe(true);
  });

  it('negating "cannot attack" does not give [Rush]: one played this turn still cannot attack', () => {
    const g = start([{ card: WADA, playedThisTurn: true }]);
    const w = inst(g, 'p1', 'characters', WADA);
    trashByKuma(g, [C14.sai, C14.marco]);
    expect(canAttackAnything(g, w)).toBe(false);
  });

  it("a card leaving the field to the trash is not a card trashed from the hand: Koala's cost does not negate it", () => {
    const g = start([WADA, 'OP14-046']);
    activate(g, inst(g, 'p1', 'characters', 'OP14-046'));
    need(g, 'choose', 'p1');
    choose(g, [inst(g, 'p1', 'characters', WADA)]);
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', WADA))).toBe(false);
  });

  it('a card trashed from the hand by an effect negates it even when a second Wadatsumi is on the field (both can attack)', () => {
    const g = start([WADA, WADA]);
    trashByKuma(g, [C14.sai, C14.marco]);
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', WADA, 0))).toBe(true);
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', WADA, 1))).toBe(true);
  });

  it("only this Character is negated: it does not make other Characters' effects stop", () => {
    const g = start([WADA, C14.sai]);
    trashByKuma(g, [C14.sai, C14.marco]);
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', C14.sai))).toBe(true);
  });
});
