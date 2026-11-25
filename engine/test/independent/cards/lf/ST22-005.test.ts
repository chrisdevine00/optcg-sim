/**
 * ST22-005 Kouzuki Oden (Character, Blue, cost 7, 8000, {Land of Wano}/{Kouzuki Clan}/{Whitebeard
 * Pirates}).
 *
 * Card text: "If this Character would be removed from the field by your opponent's effect, you may
 * trash 2 cards from your hand instead.
 * [Activate: Main] [Once Per Turn] You may rest 3 of your DON!! cards and return 1 of your
 * Characters other than this Character to the owner's hand: Set this Character as active."
 *
 * Rules: CR 8-3-1 (costs), CR 10-2 (replacement effects), battle K.O. is not an effect.
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  act,
  at,
  atMain,
  attack,
  chars,
  choices,
  decision,
  donOf,
  hand,
  kind,
  LB,
  mine,
  need,
  no,
  offeredAbilities,
  offeredIds,
  oppBounce,
  oppKo,
  passBlock,
  passCounter,
  payHand,
  SL,
  theirs,
  trash,
  yes,
} from './kit-lfb.ts';

const ID = 'ST22-005';
const CHEAP = SL.c2;

/** The activation's two cost parts: 3 active DON!! rested and one other Character returned. */
function payActivation(g: TestGame, back: InstanceId): void {
  for (let i = 0; i < 12; i++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.purpose !== 'cost') return;
    const don = g
      .legal()
      .find(
        (a) =>
          a.type === 'pick' &&
          typeof a.choice === 'object' &&
          'from' in a.choice &&
          a.choice.from === 'costActive',
      );
    if (don) {
      g.act(don);
      continue;
    }
    if (choices(g).includes(back)) {
      act(g, { type: 'pick', choice: back });
      continue;
    }
    return;
  }
}

function activate(g: TestGame, back: InstanceId): void {
  const oden = at(g, 'p1', 'characters', ID);
  const [ability] = offeredAbilities(g, oden);
  if (!ability) throw new Error('not offered');
  act(g, { type: 'activate', card: oden, ability });
  payActivation(g, back);
}

function mineRested(extra: (string | { card: string; rested?: boolean })[] = [CHEAP]) {
  return mine(LB.neutral, { characters: [{ card: ID, rested: true }, ...extra] });
}

describe('ST22-005 Kouzuki Oden: [Activate: Main] rest 3 DON!! and return another Character: set this as active', () => {
  it('pays 3 DON!! (rested) and returns the other Character to hand; Oden becomes active', () => {
    const g = mineRested();
    const oden = at(g, 'p1', 'characters', ID);
    expect(g.card(oden).rested).toBe(true);
    activate(g, at(g, 'p1', 'characters', CHEAP));
    expect(atMain(g)).toBe(true);
    expect(g.card(oden).rested).toBe(false);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([CHEAP]);
    expect(donOf(g, 'p1').active).toBe(7);
    expect(donOf(g, 'p1').rested).toBe(3);
  });

  it("only my other Characters can be returned: not Oden itself, not the opponent's", () => {
    const g = mine(
      LB.neutral,
      { characters: [{ card: ID, rested: true }, CHEAP, SL.c4] },
      { characters: [SL.c1] },
    );
    const oden = at(g, 'p1', 'characters', ID);
    const [ability] = offeredAbilities(g, oden);
    act(g, { type: 'activate', card: oden, ability: ability! });
    // Pay the DON!! first, then look at the Character candidates.
    for (let i = 0; i < 6 && kind(g) === 'choose'; i++) {
      if (choices(g).length) break;
      const don = g.legal().find((a) => a.type === 'pick');
      if (!don) break;
      g.act(don);
    }
    expect(offeredIds(g)).toEqual([CHEAP, SL.c4].sort());
    expect(choices(g)).not.toContain(oden);
  });

  it('with no other Character the cost cannot be paid: the ability is not offered', () => {
    const g = mine(LB.neutral, { characters: [{ card: ID, rested: true }] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('with only 2 active DON!! the cost cannot be paid: the ability is not offered', () => {
    const g = mine(
      LB.neutral,
      { characters: [{ card: ID, rested: true }, CHEAP], costArea: { active: 2, rested: 8 } },
      {},
    );
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('exactly 3 active DON!! is enough (boundary)', () => {
    const g = mine(LB.neutral, {
      characters: [{ card: ID, rested: true }, CHEAP],
      costArea: { active: 3, rested: 7 },
    });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toHaveLength(1);
    activate(g, at(g, 'p1', 'characters', CHEAP));
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(false);
    expect(donOf(g, 'p1').active).toBe(0);
  });

  it('[Once Per Turn]: after one use it is not offered again, even with another Character to return', () => {
    const g = mineRested([CHEAP, SL.c4]);
    activate(g, at(g, 'p1', 'characters', CHEAP));
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('it lets Oden attack twice: attack, rest, activate, attack again', () => {
    const g = mine(
      LB.neutral,
      { characters: [ID, CHEAP] },
      { life: [SL.miss, SL.miss, SL.miss, SL.miss] },
    );
    const oden = at(g, 'p1', 'characters', ID);
    attack(g, oden, g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(3);
    expect(g.card(oden).rested).toBe(true);
    activate(g, at(g, 'p1', 'characters', CHEAP));
    expect(g.card(oden).rested).toBe(false);
    attack(g, oden, g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(2);
  });

  it("the returned Character goes to its owner's hand (not the trash or deck)", () => {
    const g = mineRested();
    activate(g, at(g, 'p1', 'characters', CHEAP));
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([CHEAP]);
  });
});

describe("ST22-005 Kouzuki Oden: replacement for removal by the opponent's effect", () => {
  const field = (hnd: string[] = [SL.c2, SL.c4, SL.miss]) =>
    theirs(LB.neutral, { characters: [ID], hand: hnd }, { hand: ['OP10-019', 'OP14-048'] });

  it('K.O. by an opposing effect: yes trashes 2 hand cards and Oden stays on the field', () => {
    const g = field();
    oppKo(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHand(g, [SL.c2, SL.c4]);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([SL.c2, SL.c4].sort());
    expect(hand(g)).toEqual([SL.miss]);
  });

  it('declining: Oden is K.O.d and nothing is trashed from hand', () => {
    const g = field();
    oppKo(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toHaveLength(3);
  });

  it('"removed from the field" also covers being returned to the hand by an opposing effect', () => {
    const g = field();
    oppBounce(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHand(g, [SL.c2, SL.c4]);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([SL.miss]);
  });

  it('with fewer than 2 cards in hand the replacement cannot be paid: Oden is removed', () => {
    const g = field([SL.c2]);
    oppKo(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SL.c2]);
  });

  it('exactly 2 cards in hand is enough (boundary): both are trashed', () => {
    const g = field([SL.c2, SL.c4]);
    oppKo(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'choose') payHand(g, [SL.c2, SL.c4]);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SL.c2, SL.c4].sort());
  });

  it('must not happen: a battle K.O. is not an effect, so no replacement is offered', () => {
    const g = theirs(
      LB.neutral,
      { characters: [{ card: ID, rested: true }], hand: [SL.c2, SL.c4, SL.miss] },
      { characters: [SL.big8] },
    );
    attack(g, g.find('p2', 'characters', SL.big8), at(g, 'p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toHaveLength(3);
  });

  it("must not happen: my own effect's cost that returns another Character does not trigger it", () => {
    const g = mineRested();
    activate(g, at(g, 'p1', 'characters', CHEAP));
    expect(kind(g)).toBe('main');
  });
});
