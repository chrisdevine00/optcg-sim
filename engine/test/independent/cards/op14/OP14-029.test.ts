/**
 * OP14-029 Tashigi (Character, cost 5, 6000, Counter +1000, {Navy}).
 *
 * Card text: "[Opponent's Turn] If this Character would be removed from the field by your opponent's
 * effect, you may rest 1 of your cards instead.
 * [Activate: Main] [Once Per Turn] You may rest 2 of your cards: This Character gains +2000 power
 * until the end of your opponent's next End Phase."
 *
 * Rules: a replacement (CR 8-1-3-4) is optional when worded "may"; declining lets the removal
 * happen; an impossible replacement (nothing to rest) cannot be applied (RL-31, CR 8-1-3-4-5). It
 * covers removal by the opponent's effect only, not a battle K.O. "Cards" in "rest 1 of your cards"
 * are any of my active Leader, Characters, Stage or DON!! cards (the engine's cost prompt lists
 * them; open question M6b-Q25). "Until the end of your opponent's next End Phase" covers the
 * opponent's whole next turn (RL-11).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  chr,
  donOf,
  endTurn,
  kind,
  LD14,
  mine,
  need,
  no,
  offeredAbilities,
  opponentKOs,
  passBlock,
  passCounter,
  payRest,
  pickInst,
  playRaw,
  S14,
  theirs,
  trash,
  unusable,
  useAbility,
  yes,
} from './kit-op14a.ts';

const TASHIGI = 'OP14-029';
const LIGHTNING = 'OP09-077';

describe('OP14-029 Tashigi: [Activate: Main] [Once Per Turn] rest 2 cards for +2000 power', () => {
  function mineBoard(active = 3) {
    return mine(LD14.luffy, {
      costArea: { active, rested: 0 },
      characters: [TASHIGI, S14.marco],
    });
  }

  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = mineBoard();
    const t = at(g, 'p1', 'characters', TASHIGI);
    expect(g.card(t).cost).toBe(5);
    expect(g.power(t)).toBe(6000);
    expect(g.card(t).counter).toBe(1000);
  });

  it('resting 2 active DON!! gives +2000 power (8000)', () => {
    const g = mineBoard();
    const t = at(g, 'p1', 'characters', TASHIGI);
    useAbility(g, t);
    payRest(g, [], 2);
    expect(g.power(t)).toBe(8000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
    need(g, 'main', 'p1');
  });

  it('the 2 cards may be a Character and my Leader instead of DON!!', () => {
    const g = mineBoard();
    const t = at(g, 'p1', 'characters', TASHIGI);
    useAbility(g, t);
    payRest(g, [chr(g, 'p1', S14.marco), g.leader('p1')], 0);
    expect(g.power(t)).toBe(8000);
    expect(g.card(chr(g, 'p1', S14.marco)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
  });

  it('Tashigi herself may be one of the 2 cards rested for the cost, and still gains the power', () => {
    const g = mineBoard();
    const t = at(g, 'p1', 'characters', TASHIGI);
    useAbility(g, t);
    payRest(g, [t], 1);
    expect(g.card(t).rested).toBe(true);
    expect(g.power(t)).toBe(8000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('[Once Per Turn]: it is not offered a second time this turn', () => {
    const g = mineBoard(5);
    const t = at(g, 'p1', 'characters', TASHIGI);
    useAbility(g, t);
    payRest(g, [], 2);
    expect(offeredAbilities(g, t)).toEqual([]);
  });

  it('unpayable: with fewer than 2 active cards to rest it cannot be activated', () => {
    const g = mine(
      { card: LD14.luffy, rested: true },
      { costArea: { active: 1, rested: 0 }, characters: [{ card: TASHIGI, rested: true }] },
    );
    // The Leader and Tashigi are rested and only 1 DON!! is active: only 1 card can be rested.
    expect(offeredAbilities(g, at(g, 'p1', 'characters', TASHIGI))).toEqual([]);
  });

  it("the +2000 lasts through the opponent's next turn and ends with their End Phase", () => {
    const g = mineBoard();
    const t = at(g, 'p1', 'characters', TASHIGI);
    useAbility(g, t);
    payRest(g, [], 2);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(t)).toBe(8000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(t)).toBe(6000);
  });
});

/** p2's turn; p1 has Tashigi (and extras) with `active` DON!!; p2 holds `hand`. */
function defend(
  mychars: (string | { card: string; rested?: boolean })[],
  hand: string[],
  active = 2,
  p2chars: string[] = [S14.dadan],
) {
  return theirs(
    LD14.luffy,
    { costArea: { active, rested: 0 }, characters: [TASHIGI, ...mychars] },
    { hand, characters: p2chars },
  );
}

describe("OP14-029 Tashigi: [Opponent's Turn] replacement: rest 1 of my cards instead of being removed", () => {
  it('K.O. by an opposing effect: accepting rests 1 of my cards and Tashigi stays on the field', () => {
    const g = defend([], [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', TASHIGI));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payRest(g, [], 1);
    expect(chars(g)).toEqual([TASHIGI]);
    expect(trash(g)).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
  });

  it('the card rested may be one of my Characters', () => {
    const g = defend([S14.marco], [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', TASHIGI));
    yes(g, 'p1');
    payRest(g, [chr(g, 'p1', S14.marco)], 0);
    expect(chars(g)).toEqual([TASHIGI, S14.marco].sort());
    expect(g.card(chr(g, 'p1', S14.marco)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2 });
  });

  it('the card rested may be Tashigi herself: she is rested and stays on the field', () => {
    const g = defend([], [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', TASHIGI));
    yes(g, 'p1');
    payRest(g, [at(g, 'p1', 'characters', TASHIGI)], 0);
    expect(chars(g)).toEqual([TASHIGI]);
    expect(g.card(at(g, 'p1', 'characters', TASHIGI)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
  });

  it('declining lets the K.O. happen as written and rests nothing', () => {
    const g = defend([], [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', TASHIGI));
    no(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([TASHIGI]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
  });

  it('it may be used again for a second effect the same turn (it is not once per turn)', () => {
    const g = defend([], [LIGHTNING, LIGHTNING], 3);
    opponentKOs(g, at(g, 'p1', 'characters', TASHIGI));
    yes(g, 'p1');
    payRest(g, [], 1);
    opponentKOs(g, at(g, 'p1', 'characters', TASHIGI));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payRest(g, [], 1);
    expect(chars(g)).toEqual([TASHIGI]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('a K.O. in battle is not removal by an effect: it is not replaced', () => {
    const g = theirs(
      LD14.luffy,
      { costArea: { active: 2, rested: 0 }, characters: [{ card: TASHIGI, rested: true }] },
      { characters: [S14.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', S14.kingdew), at(g, 'p1', 'characters', TASHIGI));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([TASHIGI]);
  });

  it('it protects only itself: another Character of mine is K.O.d by the same effect without a question', () => {
    const g = defend([S14.marco], [LIGHTNING]);
    opponentKOs(g, chr(g, 'p1', S14.marco));
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([TASHIGI]);
    expect(trash(g)).toEqual([S14.marco]);
  });

  it('impossible replacement: with nothing of mine left to rest, the K.O. simply happens', () => {
    const g = theirs(
      { card: LD14.luffy, rested: true } as unknown as string,
      { costArea: { active: 0, rested: 2 }, characters: [{ card: TASHIGI, rested: true }] },
      { hand: [LIGHTNING], characters: [S14.dadan] },
    );
    playRaw(g, LIGHTNING);
    yes(g, 'p2');
    // DON!! -2 is paid from p2's field; then the target.
    for (let i = 0; i < 2 && kind(g) === 'choose' && g.decider === 'p2'; i++) {
      const p = g.legal().find((a) => a.type === 'pick' && typeof a.choice === 'object');
      if (!p) break;
      g.act(p);
    }
    pickInst(g, [at(g, 'p1', 'characters', TASHIGI)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    unusable(g, 'p1');
    expect(trash(g)).toEqual([TASHIGI]);
  });
});
