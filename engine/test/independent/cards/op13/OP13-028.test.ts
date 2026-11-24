/**
 * OP13-028 Shanks (Character, Green, cost 10, 12000, no Counter, {FILM}/{The Four Emperors}/
 * {Red-Haired Pirates}, Slash).
 *
 * Card text: "[On Play] Set all of your DON!! cards as active. Then, you cannot play cards from your
 * hand during this turn."
 *
 * Rules: "all" means every rested DON!! in the cost area (10 DON!! at most can be on the field, so
 * the whole cost is set back); "cannot play cards from your hand" bars Characters, Events
 * and Stages alike until the end of the turn and binds only the effect's controller. M6b-Q33 (the
 * bar has no hand-only scope in the DSL) is open: only plays from the hand are tested, so the
 * hand-only scope itself is an API gap (API-GAPS-a.md G2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  canPlayCard,
  don,
  endTurn,
  L13,
  mine,
  need,
  playRaw,
  toMyNextMain,
  V13,
} from './kit-op13a.ts';

const SHANKS = 'OP13-028';
const METEOR = 'OP13-020';
const STAGE = 'OP13-022';

function board(
  extraHand: string[] = [V13.marco, METEOR, STAGE],
  costArea = { active: 10, rested: 0 },
) {
  const g = mine(L13.luffy, { hand: [SHANKS, ...extraHand], costArea }, { hand: [V13.komachiyo] });
  playRaw(g, SHANKS);
  return g;
}

describe('OP13-028 Shanks: [On Play] set all DON!! active, then no plays from hand this turn', () => {
  it('printed values: cost 10, 12000, no Counter', () => {
    const g = mine(L13.luffy, { hand: [SHANKS], costArea: { active: 10, rested: 0 } });
    const c = g.card(at(g, 'p1', 'hand', SHANKS));
    expect(c.cost).toBe(10);
    expect(c.counter ?? null).toBeNull();
    playRaw(g, SHANKS);
    expect(g.power(at(g, 'p1', 'characters', SHANKS))).toBe(12000);
  });

  it('after paying 10, every DON!! is active again', () => {
    const g = board([], { active: 10, rested: 0 });
    need(g, 'main', 'p1');
    expect(don(g)).toMatchObject({ active: 10, rested: 0 });
  });

  it('then: a Character card cannot be played from hand this turn', () => {
    const g = board();
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.marco))).toBe(false);
  });

  it('then: an Event card and a Stage card cannot be played from hand either', () => {
    const g = board();
    expect(canPlayCard(g, at(g, 'p1', 'hand', METEOR))).toBe(false);
    expect(canPlayCard(g, at(g, 'p1', 'hand', STAGE))).toBe(false);
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false);
  });

  it('only plays are barred: giving DON!!, attacking and ending the turn stay legal', () => {
    const g = board();
    const kinds = new Set(g.legal().map((a) => a.type));
    expect(kinds.has('giveDon')).toBe(true);
    expect(kinds.has('attack')).toBe(true);
    expect(kinds.has('endTurn')).toBe(true);
  });

  it('the bar ends with the turn: on my next turn the same cards can be played', () => {
    const g = board();
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.marco))).toBe(true);
    expect(canPlayCard(g, at(g, 'p1', 'hand', METEOR))).toBe(true);
  });

  it("the bar binds me only: p2 can play a card from hand in p2's own turn (fresh position, no Shanks needed)", () => {
    const g = board();
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canPlayCard(g, g.find('p2', 'hand', V13.komachiyo))).toBe(true);
  });

  it('the set DON!! are usable again: giving one to my Leader is legal and moves it out of the cost area', () => {
    const g = board();
    act(g, { type: 'giveDon', target: g.leader('p1') });
    expect(don(g)).toMatchObject({ active: 9, given: 1 });
  });

  it('without enough DON!! to pay 10 it cannot be played at all (nothing is set, no bar)', () => {
    const g = mine(L13.luffy, { hand: [SHANKS, V13.marco], costArea: { active: 9, rested: 0 } });
    expect(canPlayCard(g, at(g, 'p1', 'hand', SHANKS))).toBe(false);
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.marco))).toBe(true);
  });
});
