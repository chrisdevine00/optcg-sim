/**
 * OP14-001 Trafalgar Law (Leader, red, 5000, 5 Life, {Heart Pirates}/{Supernovas}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Select 2 of your {Supernovas} or {Heart Pirates} type
 * Characters. Swap the base power of the selected Characters with each other during this turn."
 *
 * Rules: "base" is the printed number (CR 4-9-2); modifiers (given DON!!) apply on top of it. "During
 * this turn" ends with the turn. Once Per Turn is per Leader per turn. Only Characters are
 * selectable, never the Leader, and only the controller's own ("of your"). The engine may pick the
 * second Character itself when only one is left (forced pick), so tests do not require a second
 * prompt unless there are several candidates left.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chr,
  mine,
  need,
  noDefence,
  offeredAbilities,
  offeredIds,
  pickInst,
  toMyNextMain,
  useAbility,
  W,
  powerOf,
  act,
  kind,
  choices,
  canFinish,
} from './kit-w4b.ts';

const LAW = 'OP14-001';

/** p1's Main Phase with Law as Leader, 10 active DON!!. */
function board(
  mineChars: (string | { card: string; rested?: boolean; don?: number })[],
  active = 10,
) {
  return mine(LAW, { characters: mineChars, costArea: { active, rested: 0 } }, { characters: [] });
}

/** Activate the swap and pick two Characters (the second prompt is skipped by the engine when forced). */
function swap(g: ReturnType<typeof board>, a: string, b: string) {
  useAbility(g, g.leader('p1'));
  need(g, 'choose', 'p1');
  pickInst(g, [chr(g, 'p1', a)]);
  if (kind(g) === 'choose') pickInst(g, [chr(g, 'p1', b)]);
}

describe('OP14-001 Trafalgar Law: [Activate: Main] swap base power of 2 Characters', () => {
  it('swaps the base power of two selected Characters (6000 and 3000 become 3000 and 6000)', () => {
    const g = board([W.jeanBart, W.bepo]);
    expect(powerOf(g, 'p1', W.jeanBart)).toBe(6000);
    expect(powerOf(g, 'p1', W.bepo)).toBe(3000);
    swap(g, W.jeanBart, W.bepo);
    need(g, 'main', 'p1');
    expect(powerOf(g, 'p1', W.jeanBart)).toBe(3000);
    expect(powerOf(g, 'p1', W.bepo)).toBe(6000);
  });

  it('offers only {Supernovas} or {Heart Pirates} Characters, never the Leader or other types', () => {
    const g = board([W.jeanBart, W.zoro, W.marco, W.komachiyo, W.bepo]);
    useAbility(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W.bepo, W.jeanBart, W.zoro].sort());
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('after the first pick the second prompt offers the other eligible Characters, not the first one again', () => {
    const g = board([W.jeanBart, W.zoro, W.bepo, W.marco]);
    useAbility(g, g.leader('p1'));
    pickInst(g, [chr(g, 'p1', W.jeanBart)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W.bepo, W.zoro].sort());
  });

  it('a {Supernovas} Character can be swapped with a {Heart Pirates} one', () => {
    const g = board([W.zoro, W.bepo, W.marco]);
    swap(g, W.zoro, W.bepo);
    expect(powerOf(g, 'p1', W.zoro)).toBe(3000);
    expect(powerOf(g, 'p1', W.bepo)).toBe(6000);
    expect(powerOf(g, 'p1', W.marco)).toBe(5000);
  });

  it("the opponent's Characters are not selectable even with a matching type", () => {
    const g = mine(LAW, { characters: [W.bepo, W.jeanBart] }, { characters: [W.law7, W.apoo8] });
    useAbility(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W.bepo, W.jeanBart].sort());
    expect(choices(g).sort()).toEqual(
      g
        .zone('p1', 'characters')
        .map((c) => c.instance)
        .sort(),
    );
  });

  it('given DON!! stays on top of the swapped base power (modifiers are not swapped)', () => {
    const g = board([{ card: W.jeanBart, don: 2 }, W.bepo], 8);
    expect(powerOf(g, 'p1', W.jeanBart)).toBe(8000);
    swap(g, W.jeanBart, W.bepo);
    expect(powerOf(g, 'p1', W.jeanBart)).toBe(5000);
    expect(powerOf(g, 'p1', W.bepo)).toBe(6000);
  });

  it('rested Characters can be selected too', () => {
    const g = board([{ card: W.jeanBart, rested: true }, W.bepo]);
    swap(g, W.jeanBart, W.bepo);
    expect(powerOf(g, 'p1', W.jeanBart)).toBe(3000);
    expect(powerOf(g, 'p1', W.bepo)).toBe(6000);
  });

  it('swapping two Characters of equal base power changes nothing', () => {
    const g = board([W.jeanBart, W.zoro]);
    swap(g, W.jeanBart, W.zoro);
    expect(powerOf(g, 'p1', W.jeanBart)).toBe(6000);
    expect(powerOf(g, 'p1', W.zoro)).toBe(6000);
  });

  it('the swapped power is the real power in battle (a 3000 Character at 6000 beats a 5000 Leader)', () => {
    const g = board([W.jeanBart, W.bepo]);
    swap(g, W.jeanBart, W.bepo);
    const bepo = at(g, 'p1', 'characters', W.bepo);
    attack(g, bepo, g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('is Once Per Turn: not offered again this turn, offered again next turn', () => {
    const g = board([W.jeanBart, W.bepo]);
    swap(g, W.jeanBart, W.bepo);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, g.leader('p1'))).toHaveLength(1);
  });

  it('lasts "during this turn" only: back to printed power at the opponent\'s turn and the next turn', () => {
    const g = board([W.jeanBart, W.bepo]);
    swap(g, W.jeanBart, W.bepo);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(powerOf(g, 'p1', W.jeanBart)).toBe(6000);
    expect(powerOf(g, 'p1', W.bepo)).toBe(3000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(powerOf(g, 'p1', W.jeanBart)).toBe(6000);
    expect(powerOf(g, 'p1', W.bepo)).toBe(3000);
  });

  it('with fewer than 2 eligible Characters nothing can be swapped (the lone Character keeps its power)', () => {
    // Whether the engine offers the ability at all is not specified; only that nothing changes.
    const g = board([W.bepo, W.marco]);
    if (offeredAbilities(g, g.leader('p1')).length) {
      useAbility(g, g.leader('p1'));
      for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
        const c = choices(g)[0];
        if (c) act(g, { type: 'pick', choice: c });
        else if (canFinish(g)) act(g, { type: 'done' });
        else break;
      }
    }
    expect(powerOf(g, 'p1', W.bepo)).toBe(3000);
    expect(powerOf(g, 'p1', W.marco)).toBe(5000);
  });
});
