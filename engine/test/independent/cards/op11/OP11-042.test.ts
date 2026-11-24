/**
 * OP11-042 Vito (Blue Character, cost 3, 4000, Counter +1000, {Firetank Pirates}).
 *
 * Card text: "[On Play] You may trash 1 {Firetank Pirates} type card from your hand: This Character
 * gains [Rush] during this turn."
 *
 * Rules: the cost is optional and needs a {Firetank Pirates} card in hand (exactly 1 is trashed).
 * [Rush] lets a Character attack the turn it is played (CR 10-1-1) and lasts only this turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  C11,
  canHit,
  fill,
  hand,
  kind,
  L11,
  mine,
  need,
  no,
  noDefence,
  offeredIds,
  payHand,
  playCard,
  toMyNextMain,
  trash,
  unusable,
  yes,
  canAttackAnything,
} from './kit-op11b.ts';

const VITO = 'OP11-042';

function play(extraHand: string[]) {
  const g = mine(
    L11.mono,
    { hand: [VITO, ...extraHand] },
    { characters: [{ card: C11.c2, rested: true }] },
  );
  playCard(g, VITO);
  return g;
}

describe('OP11-042 Vito: [On Play] you may trash a {Firetank Pirates} card: gains [Rush] this turn', () => {
  it('paying with a {Firetank Pirates} card gives [Rush]: Vito can attack the Leader the turn it is played', () => {
    const g = play([C11.fire3]);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [C11.fire3]);
    const vito = at(g, 'p1', 'characters', VITO);
    expect(g.card(vito).keywords).toContain('Rush');
    expect(canHit(g, vito, g.leader('p2'))).toBe(true);
    expect(trash(g)).toEqual([C11.fire3]);
  });

  it('the Rush attack works: 4000 against a rested 4000 Character K.O.s it', () => {
    const g = play([C11.fire3]);
    yes(g);
    payHand(g, [C11.fire3]);
    attack(g, at(g, 'p1', 'characters', VITO), at(g, 'p2', 'characters', C11.c2));
    noDefence(g);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([C11.c2]);
  });

  it('declining the cost: no [Rush], and the new Character cannot attack', () => {
    const g = play([C11.fire3]);
    need(g, 'optional', 'p1');
    no(g);
    const vito = at(g, 'p1', 'characters', VITO);
    expect(g.card(vito).keywords).not.toContain('Rush');
    expect(canAttackAnything(g, vito)).toBe(false);
    expect(hand(g)).toEqual([C11.fire3]);
  });

  it('only {Firetank Pirates} cards can pay: with two of them and a Marco, exactly those two are offered', () => {
    const g = play([C11.fire3, C11.fire5, C11.c3]);
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.fire3, C11.fire5].sort());
  });

  it('exactly 1 card is trashed even when several qualify', () => {
    const g = play([C11.fire3, C11.fire5]);
    yes(g);
    payHand(g, [C11.fire5]);
    expect(trash(g)).toEqual([C11.fire5]);
    expect(hand(g)).toEqual([C11.fire3]);
  });

  it('with no {Firetank Pirates} card in hand the cost cannot be paid: no [Rush]', () => {
    const g = play([C11.c3, BLUE]);
    unusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(g.card(at(g, 'p1', 'characters', VITO)).keywords).not.toContain('Rush');
    expect(trash(g)).toEqual([]);
    expect(hand(g).sort()).toEqual([BLUE, C11.c3].sort());
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = play([]);
    unusable(g, 'p1');
    expect(canAttackAnything(g, at(g, 'p1', 'characters', VITO))).toBe(false);
  });

  it('[Rush] lasts only this turn: it is gone at my next turn', () => {
    const g = play([C11.fire3, ...fill(BLUE, 1)]);
    yes(g);
    payHand(g, [C11.fire3]);
    toMyNextMain(g);
    expect(g.card(at(g, 'p1', 'characters', VITO)).keywords).not.toContain('Rush');
  });
});
