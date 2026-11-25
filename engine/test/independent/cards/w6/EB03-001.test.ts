/**
 * EB03-001 Nefeltari Vivi (Leader, Blue/Red, 5000, 4 Life, Slash, {Alabasta}).
 *
 * Card text:
 * "[Once Per Turn] If your Character with a base cost of 4 or more would be K.O.'d, you may trash 1
 * card from your hand instead.
 * [Activate: Main] You may rest this Leader: Give up to 1 of your opponent's Characters −2000 power
 * during this turn. Then, up to 1 of your Characters without a [When Attacking] effect gains [Rush]
 * during this turn."
 *
 * Rules: CR 8-3-1 (cost before the colon), CR 10-2-13 ([Once Per Turn] per card), CR 8-1-3-1
 * (replacement "instead"), CR 10-1-2 ([Rush]: may attack the turn it is played), base cost is the
 * printed cost. "Without a [When Attacking] effect" reads the printed text (M6b-Q70: keywords and
 * other timings do not count as [When Attacking]).
 * An optional cost paid from the hidden hand is offered even when it cannot be paid, with accept
 * illegal (DECISIONS 2026-10-29).
 *
 * Scenery (printed): OP02-020 LittleOars Jr. 9000 (attacker), OP01-018 Hajrudin cost 4 6000, OP01-023
 * Marco cost 3 5000, OP02-007 Thatch cost 6 8000, OP01-012 Sai 4000, OP01-052 Raizo ([When
 * Attacking]), OP01-080 Zala ([On K.O.]).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { act, attack, canAttack, decision } from '../../helpers.ts';
import { myTurn, side, theirTurn } from '../kit.ts';
import {
  BLUE,
  isChoose,
  kw,
  LW,
  need,
  none,
  offeredAbilities,
  offeredCards,
  ofZone,
  payHand,
  pickCards,
  RED,
  SC6,
  toMyNextMain,
  unusable,
  useAbility,
  yes,
  no,
} from './kit-w6a.ts';

const ID = 'EB03-001';

/** p1's turn: Vivi with `mine`, p2 with `theirs`. */
function mineTurn(o: { chars?: PlayerSpec['characters']; theirs?: PlayerSpec['characters'] } = {}) {
  return myTurn(
    side(ID, BLUE, { characters: o.chars ?? [], costArea: { active: 3, rested: 0 } }),
    side(LW.luffy, RED, { characters: o.theirs ?? [], costArea: { active: 3, rested: 0 } }),
  );
}

/** Activate the Leader ability. The "you may rest this Leader" cost is paid by choosing to activate. */
function activateVivi(g: ReturnType<typeof mineTurn>) {
  useAbility(g, g.leader('p1'));
}

/** p2's turn: `oars` Oars (9000) of p2 can attack p1's rested Characters. */
function theirsTurn(o: { chars: PlayerSpec['characters']; hand?: CardId[]; oars?: number }) {
  return theirTurn(
    side(ID, BLUE, { characters: o.chars, hand: o.hand ?? [SC6.c3k, SC6.c4k] }),
    side(LW.luffy, RED, {
      characters: Array.from({ length: o.oars ?? 1 }, () => SC6.c9k),
      costArea: { active: 3, rested: 0 },
    }),
  );
}

/** p2's nth Oars attacks p1's nth rested defender of `defender`; p1 neither blocks nor counters. */
function hit(g: ReturnType<typeof theirsTurn>, defender: CardId, nth = 0, oars = 0) {
  attack(g, g.find('p2', 'characters', SC6.c9k, oars), g.find('p1', 'characters', defender, nth));
  act(g, { type: 'block', blocker: null, player: 'p1' });
  act(g, { type: 'endCounter', player: 'p1' });
}

describe('EB03-001 Nefeltari Vivi: [Activate: Main] rest this Leader: -2000 to an opposing Character, then up to 1 Character without [When Attacking] gains [Rush]', () => {
  it('rests the Leader, gives -2000 power this turn and gives Rush to a Character', () => {
    const g = mineTurn({ chars: [SC6.c5k], theirs: [SC6.c4k] });
    const sai = g.find('p2', 'characters', SC6.c4k);
    const marco = g.find('p1', 'characters', SC6.c5k);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    activateVivi(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c4k]);
    expect(g.power(sai)).toBe(2000);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c5k]);
    pickCards(g, [SC6.c5k]);
    expect(decision(g)?.kind).toBe('main');
    expect(kw(g, marco)).toContain('Rush');
  });

  it('only opposing Characters can be given -2000: own Characters and the Leaders are not offered', () => {
    const g = mineTurn({ chars: [SC6.c5k], theirs: [SC6.c4k, SC6.c6k] });
    activateVivi(g);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c4k, SC6.c6k].sort());
  });

  it('"up to 1": the -2000 may be left unchosen, and the cost (resting the Leader) is paid anyway', () => {
    const g = mineTurn({ chars: [SC6.c5k], theirs: [SC6.c4k] });
    activateVivi(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(g.power(g.find('p2', 'characters', SC6.c4k))).toBe(4000);
  });

  it('Rush candidates: a Character with [When Attacking] is not offered; vanilla, [On K.O.] and keyword-only are', () => {
    const g = mineTurn({ chars: [SC6.c5k, SC6.raizo, SC6.zala, SC6.blenheim], theirs: [SC6.c4k] });
    activateVivi(g);
    pickCards(g, [SC6.c4k]);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c5k, SC6.zala, SC6.blenheim].sort());
  });

  it('"up to 1": Rush may be left unchosen', () => {
    const g = mineTurn({ chars: [SC6.c5k], theirs: [SC6.c4k] });
    activateVivi(g);
    pickCards(g, [SC6.c4k]);
    expect(decision(g)?.max).toBe(1);
    none(g);
    expect(kw(g, g.find('p1', 'characters', SC6.c5k))).not.toContain('Rush');
  });

  it('Rush lets a Character played this turn attack; without it the Character cannot', () => {
    const g = mineTurn({ chars: [{ card: SC6.c5k, playedThisTurn: true }], theirs: [] });
    const marco = g.find('p1', 'characters', SC6.c5k);
    expect(canAttack(g, marco, g.leader('p2'))).toBe(false);
    activateVivi(g);
    // No opposing Character: the -2000 pick may be empty or not asked.
    if (isChoose(g) && /opponent/.test(decision(g)?.prompt ?? '')) none(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c5k]);
    expect(kw(g, marco)).toContain('Rush');
    expect(canAttack(g, marco, g.leader('p2'))).toBe(true);
  });

  it('both effects last only this turn: next turn the power is back and Rush is gone', () => {
    const g = mineTurn({ chars: [SC6.c5k], theirs: [SC6.c4k] });
    const sai = g.find('p2', 'characters', SC6.c4k);
    const marco = g.find('p1', 'characters', SC6.c5k);
    activateVivi(g);
    pickCards(g, [SC6.c4k]);
    pickCards(g, [SC6.c5k]);
    expect(g.power(sai)).toBe(2000);
    toMyNextMain(g);
    expect(g.power(sai)).toBe(4000);
    expect(kw(g, marco)).not.toContain('Rush');
  });

  it('a rested Leader cannot activate it (the rest is the cost)', () => {
    const g = myTurn(
      side(ID, BLUE, { leader: { card: ID, rested: true }, characters: [SC6.c5k] }),
      side(LW.luffy, RED, { characters: [SC6.c4k] }),
    );
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('the Leader is rested as soon as the ability is activated, before any target is chosen', () => {
    const g = mineTurn({ chars: [SC6.c5k], theirs: [SC6.c4k] });
    useAbility(g, g.leader('p1'));
    expect(g.card(g.leader('p1')).rested).toBe(true);
    need(g, 'choose', 'p1');
  });
});

describe("EB03-001 Nefeltari Vivi: [Once Per Turn] a Character with base cost 4+ that would be K.O.'d: you may trash 1 card from hand instead", () => {
  it('accepting trashes 1 card from hand and the Character stays (battle K.O.)', () => {
    const g = theirsTurn({ chars: [{ card: SC6.c6k, rested: true }] });
    hit(g, SC6.c6k);
    yes(g, 'p1');
    if (isChoose(g, 'p1')) payHand(g, [SC6.c3k]);
    need(g, 'main', 'p2');
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c4k]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c3k]);
  });

  it('declining lets the K.O. happen and keeps the hand', () => {
    const g = theirsTurn({ chars: [{ card: SC6.c6k, rested: true }] });
    hit(g, SC6.c6k);
    no(g, 'p1');
    need(g, 'main', 'p2');
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c6k]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c3k, SC6.c4k].sort());
  });

  it("boundary: a Character with base cost 3 is K.O.'d with no question", () => {
    const g = theirsTurn({ chars: [{ card: SC6.c5k, rested: true }] });
    hit(g, SC6.c5k);
    need(g, 'main', 'p2');
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([SC6.c3k, SC6.c4k].sort());
  });

  it('boundary: base cost exactly 4 (Hajrudin) and a higher cost (Thatch, 6) are both covered', () => {
    const g = theirsTurn({ chars: [{ card: SC6.c8k, rested: true }] });
    hit(g, SC6.c8k);
    yes(g, 'p1');
    if (isChoose(g, 'p1')) payHand(g, [SC6.c4k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c8k]);
  });

  it("[Once Per Turn]: a second Character with base cost 4+ K.O.'d in the same turn is not protected", () => {
    const g = theirsTurn({
      chars: [
        { card: SC6.c6k, rested: true },
        { card: SC6.c8k, rested: true },
      ],
      oars: 2,
    });
    hit(g, SC6.c6k);
    yes(g, 'p1');
    if (isChoose(g, 'p1')) payHand(g, [SC6.c3k]);
    need(g, 'main', 'p2');
    // Second battle, same turn: the Oars that has not attacked yet.
    hit(g, SC6.c8k, 0, 1);
    need(g, 'main', 'p2');
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c3k, SC6.c8k].sort());
  });

  it("with an empty hand the trash cannot be paid: the Character is K.O.'d", () => {
    const g = theirsTurn({ chars: [{ card: SC6.c6k, rested: true }], hand: [] });
    hit(g, SC6.c6k);
    unusable(g, 'p1');
    need(g, 'main', 'p2');
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c6k]);
  });

  it('the replacement also applies to a K.O. by an effect (a Character with base cost 4+ named by K.O.)', () => {
    // p2 uses Gum-Gum Lightning (OP09-077, cost 2, [Main] DON!! -2: K.O. up to 1 Character with
    // 6000 power or less) on Hajrudin (6000, cost 4).
    const g = theirTurn(
      side(ID, BLUE, { characters: [SC6.c6k], hand: [SC6.c3k, SC6.c4k] }),
      side('ST04-001', RED, { hand: ['OP09-077'], costArea: { active: 4, rested: 0 } }),
    );
    const ev = g.find('p2', 'hand', 'OP09-077');
    act(g, { type: 'playCard', card: ev });
    // p2 pays the event, accepts its DON!! -2 cost and picks the target; then p1 is asked.
    for (let i = 0; i < 12 && decision(g)?.player === 'p2'; i++) {
      const d = decision(g);
      if (d?.kind === 'optional') yes(g, 'p2');
      else if (d?.kind === 'choose') {
        const p = g.legal().find((a) => a.type === 'pick');
        if (!p) break;
        g.act(p);
      } else break;
    }
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (isChoose(g, 'p1')) payHand(g, [SC6.c3k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c6k]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c3k]);
  });
});
