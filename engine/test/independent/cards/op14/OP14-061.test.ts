/**
 * OP14-061 Vergo (Character, Purple, cost 5, 7000, {Donquixote Pirates}/{Navy}/{Punk Hazard}).
 *
 * Card text: "[Once Per Turn] If your {Donquixote Pirates} type Character would be removed from the
 * field by your opponent's effect, you may return 1 DON!! card from your field to your DON!! deck
 * instead.
 * [When Attacking] DON!! -1: Give up to 1 of your opponent's Characters -2000 power during this turn."
 *
 * Opposing removal is OP09-077 Gum-Gum Lightning (DON!! -2: K.O. up to 1 Character with 6000 power
 * or less).
 *
 * Rules: CR 8-1-3-4 (a replacement effect, optional when worded "may"), CR 8-1-3-4-3 (the same
 * replacement does not reapply), CR 10-2-10 (DON!! -X), CR 6-6-1-2 ("during this turn"), CR 4-8-1.
 * Open reading (M6b-Q5, E-Q7): the scope of "removed from the field by your opponent's effect"; the
 * tests use a K.O. by an opposing effect, which every reading covers, and a battle K.O., which none does.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  atMain,
  C14,
  canFinish,
  choices,
  choose,
  don,
  donSum,
  inst,
  kind,
  L14,
  mine,
  mustBeUnpayable,
  need,
  noDefence,
  offeredNow,
  opponentKOs,
  payDon,
  S14,
  theirs,
  trash,
  yes,
  no,
} from './kit-op14b.ts';

const VERGO = 'OP14-061';

/** p1's turn: Vergo ready to attack, `active` DON!! in the cost area, an opposing Character of 7000 power. */
function attackPos(active = 3, p2chars: string[] = [C14.kingdew], p1chars: string[] = []) {
  return mine(
    L14.luffy,
    { characters: [VERGO, ...p1chars], costArea: { active, rested: 0 } },
    { characters: p2chars },
  );
}
function swing(g: TestGame) {
  attack(g, inst(g, 'p1', 'characters', VERGO), g.leader('p2'));
}
/** p2's turn: p1 has Vergo and DP Characters; p2 holds `n` Lightnings. */
function defendPos(p1chars: string[], n = 1, p1don = { active: 2, rested: 1 }) {
  return theirs(
    L14.luffy,
    { characters: [VERGO, ...p1chars], costArea: p1don },
    { hand: Array.from({ length: n }, () => S14.lightning) },
  );
}

describe('OP14-061 Vergo: [When Attacking] DON!! -1: -2000 to an opposing Character; [Once Per Turn] replaces removal of a {Donquixote Pirates} Character by returning 1 DON!!', () => {
  it('[When Attacking] pays DON!! -1 (one DON!! goes back to the DON!! deck) and the chosen Character gets -2000 (7000 -> 5000)', () => {
    const g = attackPos();
    const before = don(g).deck;
    swing(g);
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    need(g, 'choose', 'p1');
    choose(g, [inst(g, 'p2', 'characters', C14.kingdew)]);
    expect(g.power(inst(g, 'p2', 'characters', C14.kingdew))).toBe(5000);
    expect(donSum(g)).toMatchObject({ active: 2, deck: before + 1 });
    noDefence(g);
    expect(atMain(g)).toBe(true);
  });

  it("the -2000 lasts this turn only: the Character has 7000 power again on the opponent's turn", () => {
    const g = attackPos();
    swing(g);
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    choose(g, [inst(g, 'p2', 'characters', C14.kingdew)]);
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(inst(g, 'p2', 'characters', C14.kingdew))).toBe(7000);
  });

  it('only opposing Characters are offered (not my own, not either Leader)', () => {
    const g = attackPos(3, [C14.kingdew], [C14.sai]);
    swing(g);
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.kingdew]);
  });

  it('"up to 1": choosing nobody still pays the DON!! -1 and changes no power', () => {
    const g = attackPos();
    const before = don(g).deck;
    swing(g);
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(g.power(inst(g, 'p2', 'characters', C14.kingdew))).toBe(7000);
    expect(don(g).deck).toBe(before + 1);
  });

  it('a second opposing Character is not affected: only one target', () => {
    const g = attackPos(3, [C14.kingdew, C14.thatch]);
    swing(g);
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    choose(g, [inst(g, 'p2', 'characters', C14.thatch)]);
    expect(g.power(inst(g, 'p2', 'characters', C14.thatch))).toBe(6000);
    expect(g.power(inst(g, 'p2', 'characters', C14.kingdew))).toBe(7000);
  });

  it('declining the DON!! -1: no DON!! returned and no power change', () => {
    const g = attackPos();
    const before = don(g).deck;
    swing(g);
    no(g, 'p1');
    expect(g.power(inst(g, 'p2', 'characters', C14.kingdew))).toBe(7000);
    expect(don(g).deck).toBe(before);
    expect(donSum(g).active).toBe(3);
  });

  it('with no DON!! on my field the cost cannot be paid: nothing happens', () => {
    const g = attackPos(0);
    swing(g);
    mustBeUnpayable(g, 'p1');
    expect(g.power(inst(g, 'p2', 'characters', C14.kingdew))).toBe(7000);
  });

  it('replacement: a {Donquixote Pirates} Character that an opposing effect would K.O. stays when I return 1 DON!! instead', () => {
    const g = defendPos([C14.bellamy]);
    const before = don(g).deck;
    opponentKOs(g, inst(g, 'p1', 'characters', C14.bellamy));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([C14.bellamy, VERGO].sort());
    expect(trash(g)).toEqual([]);
    expect(don(g).deck).toBe(before + 1);
    expect(donSum(g).active + donSum(g).rested).toBe(2);
  });

  it('replacement is optional: declining lets the K.O. happen and returns no DON!!', () => {
    const g = defendPos([C14.bellamy]);
    const before = don(g).deck;
    opponentKOs(g, inst(g, 'p1', 'characters', C14.bellamy));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(trash(g)).toEqual([C14.bellamy]);
    expect(don(g).deck).toBe(before);
  });

  it('[Once Per Turn]: a second K.O. of a {Donquixote Pirates} Character in the same turn is not replaced', () => {
    const g = defendPos([C14.bellamy, C14.buffalo], 2);
    opponentKOs(g, inst(g, 'p1', 'characters', C14.bellamy));
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    opponentKOs(g, inst(g, 'p1', 'characters', C14.buffalo));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([C14.buffalo]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([C14.bellamy, VERGO].sort());
  });

  it("a Character that is not {Donquixote Pirates} (Marco) is K.O.'d with no replacement offered", () => {
    const g = defendPos([C14.marco]);
    opponentKOs(g, inst(g, 'p1', 'characters', C14.marco));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([C14.marco]);
  });

  it("with no DON!! on my field the replacement cannot be paid: the {Donquixote Pirates} Character is K.O.'d", () => {
    const g = defendPos([C14.bellamy], 1, { active: 0, rested: 0 });
    opponentKOs(g, inst(g, 'p1', 'characters', C14.bellamy));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(trash(g)).toEqual([C14.bellamy]);
  });

  it("must not cover a battle K.O.: a rested {Donquixote Pirates} Character K.O.'d by an attack is trashed with no replacement", () => {
    const g = theirs(
      L14.luffy,
      {
        characters: [VERGO, { card: C14.bellamy, rested: true }],
        costArea: { active: 2, rested: 1 },
      },
      {},
    );
    const before = don(g).deck;
    attack(g, g.leader('p2'), inst(g, 'p1', 'characters', C14.bellamy));
    noDefence(g);
    expect(trash(g)).toEqual([C14.bellamy]);
    expect(don(g).deck).toBe(before);
    expect(choices(g)).toEqual([]);
  });
});
