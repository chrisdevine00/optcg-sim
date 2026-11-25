/**
 * ST24-002 Kid & Killer (Character, Green, cost 2, 2000, Counter +1000, {Kid Pirates}/{Supernovas}).
 *
 * Card text:
 *   [On Play] Look at 5 cards from the top of your deck; reveal up to 1 "Supernovas" type card and
 *   add it to your hand. Then, place the rest at the bottom of your deck in any order.
 *   [On Your Opponent's Attack] You may trash this Character: Set up to 1 of your DON!! cards as active.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  deck,
  hand,
  kind,
  minus,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  settleOrders,
  tail,
  theirs,
  trash,
  yes,
  mine,
} from '../op17/kit-op17b.ts';
import { countIfAsked, inst, LC, playRaw, SCL } from './kit-lfc.ts';
import { donSum } from '../op14/kit-op14b.ts';
import { hasEvent } from '../kit.ts';

const KK = 'ST24-002';

function playGame(top: string[]) {
  return mine(
    LC.plain,
    {
      hand: [KK],
      deck: [...top, ...Array.from({ length: 8 }, () => BLUE)],
      costArea: { active: 2, rested: 0 },
    },
    {},
  );
}

function defend(o: { active: number; rested: number; kidRested?: boolean; withChar?: boolean }) {
  return theirs(
    LC.plain,
    {
      characters: [{ card: KK, rested: o.kidRested ?? false }],
      costArea: { active: o.active, rested: o.rested },
    },
    {
      characters: o.withChar ? [SCL.c5] : [],
      costArea: { active: 2, rested: 0 },
    },
  );
}

describe('ST24-002 Kid & Killer: [On Play] look at 5 for a "Supernovas"; [On Your Opponent\'s Attack] trash it to set a DON!! active', () => {
  const top = [SCL.nova4, SCL.c3, SCL.novaEvent, SCL.c2, SCL.nova3];
  const beyond = SCL.nova4;

  it('offers exactly the "Supernovas" cards of the top 5 (Characters and Events); the pick goes to hand, the rest to the bottom', () => {
    const g = playGame([...top, beyond]);
    playRaw(g, KK);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCL.nova4, SCL.nova3, SCL.novaEvent].sort());
    pickCards(g, [SCL.novaEvent]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCL.novaEvent]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(beyond);
    expect(tail(deck(g), 4)).toEqual(minus(top, [SCL.novaEvent]).sort());
  });

  it('the chosen card is revealed; a card that was only looked at is not', () => {
    const g = playGame([...top, beyond]);
    playRaw(g, KK);
    pickCards(g, [SCL.nova3]);
    settleOrders(g);
    expect(hasEvent(g, 'CardRevealed', { card: SCL.nova3 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SCL.c3 })).toBe(false);
  });

  it('"up to 1": may take nothing, then all 5 go to the bottom', () => {
    const g = playGame([...top, beyond]);
    playRaw(g, KK);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(beyond);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('only the top 5 are looked at: a "Supernovas" in position 6 is not offered', () => {
    const g = playGame([SCL.c2, SCL.c3, SCL.c2, SCL.c3, SCL.c2, SCL.nova4]);
    playRaw(g, KK);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SCL.nova4);
  });

  it('takes at most one card even when three qualify', () => {
    const g = playGame([...top, beyond]);
    playRaw(g, KK);
    pickCards(g, [SCL.nova4]);
    settleOrders(g);
    expect(hand(g)).toEqual([SCL.nova4]);
  });

  it("[On Your Opponent's Attack]: accepting trashes Kid & Killer and sets 1 rested DON!! active", () => {
    const g = defend({ active: 0, rested: 3 });
    attack(g, g.leader('p2'), g.leader('p1'));
    yes(g, 'p1');
    expect(trash(g)).toEqual([KK]);
    // The Character is trashed as a cost, not K.O.'d.
    expect(hasEvent(g, 'KO')).toBe(false);
    countIfAsked(g, 1);
    expect(donSum(g)).toMatchObject({ active: 1, rested: 2 });
    need(g, 'block', 'p1');
    passBlock(g);
  });

  it('declining the cost keeps Kid & Killer and sets nothing', () => {
    const g = defend({ active: 0, rested: 3 });
    attack(g, g.leader('p2'), g.leader('p1'));
    no(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(donSum(g)).toMatchObject({ active: 0, rested: 3 });
  });

  it('is also offered when the attacker is an opposing Character, and the DON!! count may be 0', () => {
    const g = defend({ active: 1, rested: 2, withChar: true });
    attack(g, inst(g, 'p2', 'characters', SCL.c5), g.leader('p1'));
    yes(g, 'p1');
    expect(trash(g)).toEqual([KK]);
    countIfAsked(g, 0);
    expect(donSum(g)).toMatchObject({ active: 1, rested: 2 });
  });

  it('is not offered on my own attack', () => {
    const g = mine(
      LC.plain,
      { characters: [KK, SCL.c5], costArea: { active: 0, rested: 3 } },
      { characters: [{ card: SCL.c2, rested: true }] },
    );
    attack(g, inst(g, 'p1', 'characters', SCL.c5), inst(g, 'p2', 'characters', SCL.c2));
    expect(kind(g)).not.toBe('optional');
    expect(kind(g)).toBe('block');
    expect(trash(g)).toEqual([]);
  });

  it('when Kid & Killer itself is attacked and trashed, the attack ends without damage', () => {
    const g = defend({ active: 0, rested: 3, kidRested: true, withChar: true });
    const attacker = inst(g, 'p2', 'characters', SCL.c5);
    attack(g, attacker, inst(g, 'p1', 'characters', KK));
    yes(g, 'p1');
    countIfAsked(g, 1);
    expect(trash(g)).toEqual([KK]);
    // The target is gone: the battle ends, nobody took damage, play returns to p2.
    while (kind(g) === 'block' || kind(g) === 'counter') {
      if (kind(g) === 'block') passBlock(g);
      else act(g, { type: 'endCounter' });
    }
    expect(g.life('p1')).toBe(4);
    expect(atMain(g, 'p2')).toBe(true);
  });
});
