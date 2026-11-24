/**
 * OP14-017 Chambres (Event, red, cost 3, {Heart Pirates}/{Supernovas}/{The Seven Warlords of the
 * Sea}).
 *
 * Card text: "[Main] Select 2 of your opponent's Characters with 9000 base power or less. Swap the
 * base power of the selected Characters with each other during this turn."
 *
 * Rules: "base power" is the printed number (CR 4-9-2): 9000 qualifies, 10000 does not. "During this
 * turn" ends with the turn. QA-OP14 (rulings.md RL-10 area): when one of two power-swapped
 * Characters leaves the field, the other keeps its swapped value until the end of the turn. The
 * engine may pick the second Character itself when only one is left (forced pick).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  canCounterWith,
  chr,
  choices,
  kind,
  mine,
  need,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  powerOf,
  theirs,
  toMyNextMain,
  trash,
  W,
  LW,
  donSum,
  noDefence,
  canFinish,
} from './kit-w4b.ts';

const EVENT = 'OP14-017';

/** p1's Main Phase: the Event in hand, 10 active DON!!, `theirs` on p2's side. */
function board(
  theirs_: (string | { card: string; rested?: boolean })[],
  mineChars: (string | { card: string; rested?: boolean })[] = [],
  active = 10,
) {
  return mine(
    LW.luffy,
    { hand: [EVENT], characters: mineChars, costArea: { active, rested: 0 } },
    { characters: theirs_ },
  );
}

/** Play the Event and pick two of p2's Characters (the second prompt is skipped when forced). */
function chambres(g: ReturnType<typeof board>, a: string, b: string) {
  playRaw(g, EVENT);
  need(g, 'choose', 'p1');
  pickInst(g, [chr(g, 'p2', a)]);
  if (kind(g) === 'choose') pickInst(g, [chr(g, 'p2', b)]);
}

describe('OP14-017 Chambres: [Main] swap the base power of 2 opposing Characters', () => {
  it('swaps the base power of the two selected Characters (9000 and 3000 become 3000 and 9000)', () => {
    const g = board([W.oars9, W.bepo]);
    chambres(g, W.oars9, W.bepo);
    need(g, 'main', 'p1');
    expect(powerOf(g, 'p2', W.oars9)).toBe(3000);
    expect(powerOf(g, 'p2', W.bepo)).toBe(9000);
  });

  it('the Event is paid for (3 DON!!) and goes to the trash', () => {
    const g = board([W.oars9, W.bepo]);
    chambres(g, W.oars9, W.bepo);
    expect(donSum(g)).toMatchObject({ active: 7, rested: 3 });
    expect(trash(g)).toEqual([EVENT]);
  });

  it('boundary: a 9000 base power Character is offered, a 10000 one is not', () => {
    const g = board([W.oars9, W.shiki10, W.johnGiant10, W.bepo, W.thatch]);
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W.bepo, W.oars9, W.thatch].sort());
  });

  it('after the first pick the second prompt offers the other eligible Characters only', () => {
    const g = board([W.oars9, W.shiki10, W.bepo, W.thatch]);
    playRaw(g, EVENT);
    pickInst(g, [chr(g, 'p2', W.oars9)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W.bepo, W.thatch].sort());
  });

  it("only the opponent's Characters are offered, never mine", () => {
    const g = board([W.oars9, W.bepo], [W.marco, W.sai]);
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    const mineInsts = g.zone('p1', 'characters').map((c) => c.instance);
    expect(choices(g).filter((c) => mineInsts.includes(c))).toEqual([]);
    expect(offeredIds(g)).toEqual([W.bepo, W.oars9].sort());
  });

  it('rested and active opposing Characters can both be selected', () => {
    const g = board([{ card: W.oars9, rested: true }, W.bepo]);
    chambres(g, W.oars9, W.bepo);
    expect(powerOf(g, 'p2', W.oars9)).toBe(3000);
    expect(powerOf(g, 'p2', W.bepo)).toBe(9000);
  });

  it('a 10000-power Character on the field does not stop the swap of two eligible ones, and keeps its power', () => {
    const g = board([W.shiki10, W.oars9, W.bepo]);
    chambres(g, W.oars9, W.bepo);
    expect(powerOf(g, 'p2', W.shiki10)).toBe(10000);
    expect(powerOf(g, 'p2', W.oars9)).toBe(3000);
  });

  it('swapping two Characters with equal base power changes nothing', () => {
    const g = board([W.thatch, W.thatch]);
    playRaw(g, EVENT);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', W.thatch, 0)]);
    if (kind(g) === 'choose') pickInst(g, [chr(g, 'p2', W.thatch, 1)]);
    expect(powerOf(g, 'p2', W.thatch, 0)).toBe(8000);
    expect(powerOf(g, 'p2', W.thatch, 1)).toBe(8000);
  });

  it('lasts this turn only: the opponent has their printed power on their own turn', () => {
    const g = board([W.oars9, W.bepo]);
    chambres(g, W.oars9, W.bepo);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(powerOf(g, 'p2', W.oars9)).toBe(9000);
    expect(powerOf(g, 'p2', W.bepo)).toBe(3000);
  });

  it('the swapped power counts in battle: a 6000 attacker K.O.s the rested 9000 Character that was swapped down to 3000', () => {
    const g = board([{ card: W.oars9, rested: true }, W.bepo], [W.hajrudin]);
    chambres(g, W.oars9, W.bepo);
    attack(g, at(g, 'p1', 'characters', W.hajrudin), chr(g, 'p2', W.oars9));
    noDefence(g);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([W.bepo]);
  });

  it('QA-OP14: when one swapped Character leaves, the other keeps the swapped value until the end of the turn', () => {
    const g = board([{ card: W.oars9, rested: true }, W.bepo], [W.hajrudin]);
    chambres(g, W.oars9, W.bepo);
    attack(g, at(g, 'p1', 'characters', W.hajrudin), chr(g, 'p2', W.oars9));
    noDefence(g);
    need(g, 'main', 'p1');
    expect(powerOf(g, 'p2', W.bepo)).toBe(9000);
    toMyNextMain(g);
    expect(powerOf(g, 'p2', W.bepo)).toBe(3000);
  });

  it('with only one eligible Character (the other is 10000) nothing can be swapped', () => {
    // Whether the engine plays the Event with a single target is left open; only that nothing changes.
    const g = board([W.shiki10, W.bepo]);
    playRaw(g, EVENT);
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      const c = choices(g)[0];
      if (c) act(g, { type: 'pick', choice: c });
      else if (canFinish(g)) act(g, { type: 'done' });
      else break;
    }
    expect(powerOf(g, 'p2', W.bepo)).toBe(3000);
    expect(powerOf(g, 'p2', W.shiki10)).toBe(10000);
  });

  it('is a [Main] Event only: it cannot be used as a Counter', () => {
    const g = theirs(
      LW.luffy,
      { hand: [EVENT], costArea: { active: 5, rested: 0 } },
      { characters: [W.thatch] },
    );
    attack(g, at(g, 'p2', 'characters', W.thatch), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    expect(canCounterWith(g, g.find('p1', 'hand', EVENT))).toBe(false);
  });

  it('with fewer than 3 active DON!! it cannot be played', () => {
    const g = board([W.oars9, W.bepo], [], 2);
    const ev = g.find('p1', 'hand', EVENT);
    expect(g.legal().some((a) => a.type === 'playCard' && a.card === ev)).toBe(false);
  });
});
