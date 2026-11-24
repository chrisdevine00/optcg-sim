/**
 * OP14-119 Dracule Mihawk (Character, Green, cost 9, 10000, no Counter, {The Seven Warlords of the
 * Sea}).
 *
 * Card text: "[Your Turn] When this Character becomes rested, up to 1 of your opponent's Characters with
 * a cost of 9 or less cannot be rested until the end of your opponent's next End Phase.
 * [On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your hand: Up to 1 of your
 * Leader or Character cards gains +2000 power during this battle."
 *
 * Rules: CR 8-1-3-1 (auto effects), CR 10-2-13 ([Once Per Turn]), digest item 57 (a card that
 * "cannot be rested" cannot attack, cannot activate [Blocker], cannot be rested by an effect).
 * Reading used (M6b-Q30 is open): attacking rests the attacker, and "becomes rested" covers an
 * attack declaration. A reading in which an attack does not count makes the first effect unusable
 * on the owner's own turn except by effects, so the attack is the only natural way to test it.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  attackers,
  blockers,
  BLUE,
  hand,
  kind,
  LD14,
  mine,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickCards,
  pickInst,
  SC14,
  theirs,
  toMyNextMain,
  trash,
  unusable,
  offeredUnpayable,
  yes,
  passBlock,
  passCounter,
  canUse,
} from './kit-op14d.ts';

const ID = 'OP14-119';
/** OP09-072 Franky: Purple, cost 4, 5000, [Blocker]. */
const BLOCKER = 'OP09-072';

function myAttack(p2chars: string[]) {
  const g = mine(LD14.neutral, { characters: [ID] }, { characters: p2chars });
  attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
  return g;
}

describe('OP14-119 Dracule Mihawk: [Your Turn] when it becomes rested, an opposing Character cannot be rested', () => {
  it('attacking rests Mihawk: the effect offers opposing Characters with cost 9 or less (cost 9 in, cost 10 out)', () => {
    const g = myAttack([SC14.c9, SC14.c10, SC14.c5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c5, SC14.c9].sort());
  });

  it('a locked [Blocker] cannot block the very attack that caused it', () => {
    const g = myAttack([BLOCKER]);
    pickCards(g, [BLOCKER]);
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
    passBlock(g);
    passCounter(g);
  });

  it('without the lock the same Blocker can block (control)', () => {
    const g = myAttack([BLOCKER]);
    need(g, 'choose', 'p1');
    none(g);
    expect(blockers(g)).toEqual([g.find('p2', 'characters', BLOCKER)]);
  });

  it("the locked Character cannot attack on its controller's next turn (it cannot be rested); the others can", () => {
    const g = myAttack([SC14.c5, SC14.c4]);
    pickCards(g, [SC14.c5]);
    passBlock(g);
    passCounter(g);
    g.act({ type: 'endTurn' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(attackers(g)).not.toContain(g.find('p2', 'characters', SC14.c5));
    expect(attackers(g)).toContain(g.find('p2', 'characters', SC14.c4));
  });

  it("the lock ends with the opponent's next End Phase: that Character attacks again the turn after", () => {
    const g = myAttack([SC14.c5]);
    pickCards(g, [SC14.c5]);
    passBlock(g);
    passCounter(g);
    toMyNextMain(g);
    g.act({ type: 'endTurn' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(attackers(g)).toContain(g.find('p2', 'characters', SC14.c5));
  });

  it('"up to 1": nobody has to be chosen', () => {
    const g = myAttack([SC14.c5]);
    need(g, 'choose', 'p1');
    none(g);
    expect(kind(g)).toBe('block');
  });

  it('only opposing Characters are offered (not my own, not either Leader)', () => {
    const g = mine(LD14.neutral, { characters: [ID, SC14.c2] }, { characters: [SC14.c5] });
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    expect(offeredIds(g)).toEqual([SC14.c5]);
  });
});

describe("OP14-119 Dracule Mihawk: [On Your Opponent's Attack] [Once Per Turn] trash 1 card: +2000 power", () => {
  function defend(o: { hand?: string[]; chars?: string[]; attacker?: string } = {}) {
    const g = theirs(
      LD14.neutral,
      {
        characters: [ID, ...(o.chars ?? [])],
        hand: o.hand ?? [SC14.c2, BLUE],
        life: [BLUE, BLUE, BLUE, BLUE],
      },
      { characters: [o.attacker ?? SC14.c4] },
    );
    attack(g, g.find('p2', 'characters', o.attacker ?? SC14.c4), g.leader('p1'));
    return g;
  }

  it('trashing 1 card gives my Leader +2000: a 6000 attack on the 5000 Leader fails', () => {
    const g = defend();
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SC14.c2]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g)).toEqual([SC14.c2]);
    expect(hand(g)).toEqual([BLUE]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: +2000 gives 7000, which a 7000 attacker still beats (attacker wins a tie)', () => {
    const g = defend({ attacker: SC14.c5 });
    yes(g);
    payHand(g, [SC14.c2]);
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it("candidates: my Leader and Characters (including Mihawk), never the opponent's", () => {
    const g = defend({ chars: [SC14.c2] });
    yes(g);
    payHand(g, [BLUE]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c2, ID, LD14.neutral].sort());
  });

  it('declining: nothing is trashed and there is no boost', () => {
    const g = defend();
    no(g);
    expect(hand(g)).toEqual([SC14.c2, BLUE].sort());
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": after the cost, the boost target may be skipped; the card stays trashed', () => {
    const g = defend();
    yes(g);
    payHand(g, [SC14.c2]);
    need(g, 'choose', 'p1');
    none(g);
    expect(trash(g)).toEqual([SC14.c2]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = defend({ hand: [] });
    offeredUnpayable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: after it was used it is not offered on the next attack of that turn', () => {
    const g = theirs(
      LD14.neutral,
      { characters: [ID], hand: [SC14.c2, SC14.c4], life: [BLUE, BLUE, BLUE, BLUE] },
      { characters: [SC14.c4, SC14.c5] },
    );
    attack(g, g.find('p2', 'characters', SC14.c4), g.leader('p1'));
    yes(g);
    payHand(g, [SC14.c2]);
    pickInst(g, [g.leader('p1')]);
    passBlock(g);
    passCounter(g);
    attack(g, g.find('p2', 'characters', SC14.c5), g.leader('p1'));
    expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
  });

  it('is also offered when one of my Characters is attacked', () => {
    const g = theirs(
      LD14.neutral,
      { characters: [ID, { card: SC14.c2, rested: true }], hand: [SC14.c4] },
      { characters: [SC14.c5] },
    );
    attack(g, g.find('p2', 'characters', SC14.c5), g.find('p1', 'characters', SC14.c2));
    expect(canUse(g)).toBe(true);
  });
});
