/**
 * OP09-114 Lindbergh (Character, Yellow, cost 3, 4000, Counter +1000, {Minks}/{Revolutionary Army}).
 *
 * Card text: "[On Play] If you and your opponent have a total of 5 or less Life cards, K.O. up to 1 of
 * your opponent's Characters with 2000 power or less.
 * [Trigger] If you and your opponent have a total of 5 or less Life cards, play this card."
 *
 * Rules: CR 8-4-4 ("up to"), power is the current power (given DON!! count), a [Trigger] whose
 * condition fails leaves the card in the trash, the Life card taken has left the Life area.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  chars,
  choices,
  hand,
  hitLeader,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playId,
  reachablePickSets,
  RED,
  skipEmptyChoose,
  theirs,
  trash,
} from './kit-op09d.ts';

const ID = 'OP09-114';

const lifeOf = (n: number, c: string) => Array(n).fill(c) as string[];

describe('OP09-114 Lindbergh: [On Play] if the Life total is 5 or less, K.O. up to 1 opposing Character with 2000 power or less', () => {
  function play(
    myLife: number,
    oppLife: number,
    opp: (string | { card: string; don?: number })[],
    o: { mine?: string[] } = {},
  ) {
    const g = mine(
      L9.neutral,
      { hand: [ID], life: lifeOf(myLife, BLUE), characters: o.mine ?? [] },
      { life: lifeOf(oppLife, RED), characters: opp },
    );
    playId(g, ID);
    return g;
  }

  it("boundary: total exactly 5 (2 + 3): the 2000-power Character is offered and K.O.'d", () => {
    const g = play(2, 3, [C9.dadan2000]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.dadan2000]);
    pickCards(g, [C9.dadan2000]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([C9.dadan2000]);
    expect(chars(g)).toEqual([ID]);
  });

  it("boundary: total 6 (3 + 3): the condition fails, nothing is asked and nothing is K.O.'d", () => {
    const g = play(3, 3, [C9.dadan2000]);
    expect(kind(g)).not.toBe('choose');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.dadan2000]);
  });

  it('total counts both players: 0 mine + 5 theirs qualifies, 5 mine + 1 theirs does not', () => {
    const a = play(0, 5, [C9.dadan2000]);
    need(a, 'choose', 'p1');
    const b = play(5, 1, [C9.dadan2000]);
    expect(kind(b)).not.toBe('choose');
    expect(chars(b, 'p2')).toEqual([C9.dadan2000]);
  });

  it('power boundary: 2000 is offered, 3000 and 4000 are not', () => {
    const g = play(2, 2, [C9.dadan2000, C9.c1, C9.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.dadan2000]);
  });

  it('"up to 1": with two eligible Characters at most one is K.O.\'d, and none is allowed', () => {
    const g = play(2, 2, [C9.dadan2000, C9.w2000]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('choosing nothing leaves every opposing Character on the field', () => {
    const g = play(2, 2, [C9.dadan2000, C9.w2000]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([C9.dadan2000, C9.w2000].sort());
  });

  it("only the opponent's Characters: my own 2000-power Character is never offered", () => {
    const g = play(2, 2, [C9.dadan2000], { mine: [C9.w2000] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.dadan2000]);
    expect(choices(g)).not.toContain(g.find('p1', 'characters', C9.w2000));
  });

  it('with no eligible opposing Character nothing happens (a public zone: the pick may be skipped or asked empty)', () => {
    const g = play(2, 2, [C9.c4]);
    skipEmptyChoose(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([C9.c4]);
  });

  it('the Leader needs no type for either part', () => {
    const g = play(1, 1, [C9.w2000]);
    need(g, 'choose', 'p1');
  });
});

describe('OP09-114 Lindbergh: [Trigger] play this card if the Life total is 5 or less', () => {
  function hit(myLife: number, oppLife: number, opp: string[] = []) {
    const g = theirs(
      L9.neutral,
      { life: [ID, ...lifeOf(myLife - 1, BLUE)] },
      { life: lifeOf(oppLife, RED), characters: opp },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('boundary: 2 left for me, 3 for the opponent (total 5): Lindbergh is played', () => {
    const g = hit(3, 3);
    activateTrigger(g);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([]);
  });

  it('boundary: 2 left for me, 4 for the opponent (total 6): not played, the card is trashed', () => {
    const g = hit(3, 4);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('played by the [Trigger], its [On Play] runs: it K.O.s a 2000-power Character of the opponent', () => {
    const g = hit(3, 2, [C9.dadan2000, C9.c4]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.dadan2000]);
    pickCards(g, [C9.dadan2000]);
    expect(chars(g, 'p2')).toEqual([C9.c4]);
    expect(chars(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it("current power decides: in the opponent's own turn a Character with DON!! given is 3000, above the limit, and is not offered", () => {
    const g = theirs(
      L9.neutral,
      { life: [ID, BLUE, BLUE] },
      {
        life: lifeOf(2, RED),
        characters: [{ card: C9.dadan2000, don: 1 }, C9.w2000],
        costArea: { active: 9, rested: 0 },
      },
    );
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(g.power(g.find('p2', 'characters', C9.dadan2000))).toBe(3000);
    expect(offeredIds(g)).toEqual([C9.w2000]);
  });

  it('declining the [Trigger] puts the card in my hand', () => {
    const g = hit(3, 2);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });
});
