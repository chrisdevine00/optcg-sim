/**
 * OP09-010 Bonk Punch (Character, Red, cost 4, 5000, Counter +1000, {Red-Haired Pirates}).
 *
 * Card text: "[On Play] Play up to 1 [Monster] from your hand. [DON!! x1] [When Attacking] This
 * Character gains +2000 power during this turn."
 *
 * Rules: [Monster] is a card NAME (CR 2-1: exact name); a card played by an effect pays no cost;
 * "up to 1" may be 0 (CR 8-4-4-1); [DON!! x1] needs at least 1 DON!! given to this Character (more
 * does not stack the effect, CR 10-2-?); each given DON!! is +1000 on my turn (RL-13); "during this
 * turn" ends in the End Phase (CR 6-6-1-3).
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, noDefence } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  chars,
  don,
  hand,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  play,
  S9,
} from './kit-op09a.ts';

const BONK = 'OP09-010';
const MONSTER = 'OP09-012'; // Red, cost 3, 4000, {Animal}/{Red-Haired Pirates}

function played(handExtra: string[]): TestGame {
  const g = mine(L9.luffy, { hand: [BONK, ...handExtra] });
  play(g, g.find('p1', 'hand', BONK));
  return g;
}

/** Bonk Punch on my board with `given` DON!! given; p2 has a 3000 Character as scenery. */
function attacker(given: number): TestGame {
  return mine(
    L9.luffy,
    { characters: [{ card: BONK, don: given }], costArea: { active: 10 - given, rested: 0 } },
    { characters: [] },
  );
}

describe('OP09-010 Bonk Punch: [On Play] play up to 1 [Monster] from hand; [DON!! x1] [When Attacking] +2000', () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = played([]);
    if (kind(g) === 'choose') none(g);
    const b = at(g, 'p1', 'characters', BONK);
    expect(g.card(b).cost).toBe(4);
    expect(g.power(b)).toBe(5000);
    expect(g.card(b).counter).toBe(1000);
  });

  it('[On Play]: plays a [Monster] from hand for free (only Bonk Punch’s 4 DON!! are paid)', () => {
    const g = played([MONSTER]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MONSTER]);
    pickCards(g, [MONSTER]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([BONK, MONSTER].sort());
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 6, rested: 4 });
  });

  it('only a card named [Monster] is offered (other cards in hand are not)', () => {
    const g = played([S9.c3, S9.c4, MONSTER]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MONSTER]);
  });

  it('"up to 1": I may play nothing; the [Monster] stays in hand', () => {
    const g = played([MONSTER]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([BONK]);
    expect(hand(g)).toEqual([MONSTER]);
  });

  it('with two [Monster] in hand, only one is played', () => {
    const g = played([MONSTER, MONSTER]);
    need(g, 'choose', 'p1');
    pickCards(g, [MONSTER]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([BONK, MONSTER].sort());
    expect(hand(g)).toEqual([MONSTER]);
  });

  it('with no [Monster] in hand nothing happens; the "up to 1" question is still asked (empty), so it never tells whether I hold one', () => {
    const g = played([S9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([BONK]);
    expect(hand(g)).toEqual([S9.c3]);
  });

  it('with an empty hand the same empty "up to 1" question is asked (a missing prompt would reveal the hand)', () => {
    const g = played([]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(atMain(g)).toBe(true);
  });

  it('[DON!! x1] [When Attacking]: with 1 DON!! given it gains +2000 (5000 + 1000 + 2000 = 8000)', () => {
    const g = attacker(1);
    const b = at(g, 'p1', 'characters', BONK);
    expect(g.power(b)).toBe(6000);
    attack(g, b, g.leader('p2'));
    expect(g.power(b)).toBe(8000);
  });

  it('boundary: with no DON!! given there is no bonus', () => {
    const g = attacker(0);
    const b = at(g, 'p1', 'characters', BONK);
    attack(g, b, g.leader('p2'));
    expect(g.power(b)).toBe(5000);
  });

  it('more DON!! does not repeat the effect: 2 DON!! give 5000 + 2000 + 2000', () => {
    const g = attacker(2);
    const b = at(g, 'p1', 'characters', BONK);
    attack(g, b, g.leader('p2'));
    expect(g.power(b)).toBe(9000);
  });

  it('"during this turn": the +2000 is still there after the battle and gone on my next turn', () => {
    const g = attacker(1);
    const b = at(g, 'p1', 'characters', BONK);
    attack(g, b, g.leader('p2'));
    noDefence(g);
    expect(g.power(b)).toBe(8000);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    // The given DON!! went back to the cost area in the Refresh Phase; no +2000 is left either.
    expect(g.power(b)).toBe(5000);
  });

  it('must not happen: the +2000 does not apply when it is played (no attack) or to other Characters', () => {
    const g = played([MONSTER]);
    pickCards(g, [MONSTER]);
    expect(g.power(at(g, 'p1', 'characters', BONK))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', MONSTER))).toBe(4000);
  });
});
