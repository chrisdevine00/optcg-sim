/**
 * PRB01-001 Sanji (Leader, Red, 5000 power, 5 Life, {Straw Hat Crew}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Up to 1 of your Characters without an [On Play] effect
 * and with a cost of 8 or less gains [Rush] during this turn."
 *
 * Rules: "without an [On Play] effect" is read from the printed text: a Character with no [On Play]
 * (whatever else it has: [Blocker], [When Attacking], [On K.O.], a [Trigger], or no text) qualifies,
 * and one whose [On Play] shares a line with another timing ([Blocker][On Play], [Your Turn] [On
 * Play]) does not; "up to 1" lets me choose none; [Rush] lets a Character attack the turn it is
 * played (CR 10-1-1); "during this turn" ends with the turn; [Once Per Turn] (CR 8-1-3-1-1).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canHit,
  chars,
  kw,
  mayChooseNone,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  playRaw,
  theirs,
  toMyNextMain,
  useAbility,
  V13,
  W6,
  snap,
  canAttackAnything,
} from './kit-w6b.ts';

const SANJI = 'PRB01-001';
/** Characters with an [On Play] in different spots of their text (none is scripted for the test, only the printed text matters). */
const ON_PLAY = {
  /** EB01-023 Edward Weevil: Blue, cost 4, "[On Play] Draw 1 card." */
  line: W6.onPlay4,
  /** EB03-010 Monet: Red, cost 5, "[Blocker] [On Play] Look at 5 ..." */
  afterBlocker: 'EB03-010',
  /** EB01-054 Gan.Fall: Yellow, cost 3, "[Blocker](reminder)[On Play] If your opponent has 1 or less Life ..." */
  gluedToBlocker: 'EB01-054',
  /** EB03-032 Charlotte Flampe: Purple, cost 1, "[Your Turn] [On Play] Up to 1 of your [Charlotte Katakuri] ..." */
  yourTurn: 'EB03-032',
  /** EB01-027 Mr. 1: Blue, cost 5, a static line, then "[On Play] Draw 2 cards and trash 1 ..." */
  afterStatic: 'EB01-027',
} as const;

function game(chs: (string | { card: string; playedThisTurn?: boolean })[], p2: string[] = []) {
  return mine(SANJI, { characters: chs, hand: [] }, { characters: p2 });
}

const leader = (g: ReturnType<typeof game>) => g.leader('p1');

describe('PRB01-001 Sanji: [Activate: Main] [Once Per Turn] up to 1 Character without an [On Play] effect and cost 8 or less gains [Rush]', () => {
  it('printed values: Leader, 5000 power', () => {
    const g = game([]);
    expect(g.power(leader(g))).toBe(5000);
    expect(g.card(leader(g)).card).toBe(SANJI);
  });

  it('offers Characters whose only text is another timing, a keyword or a [Trigger]; never one with an [On Play]', () => {
    const g = game([V13.sai, W6.whenAtt4, W6.onKO3, W6.carrot, ON_PLAY.line]);
    useAbility(g, leader(g));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.sai, W6.whenAtt4, W6.onKO3, W6.carrot].sort());
  });

  it('a [Blocker]-only Character (its reminder text is explanation, not an effect) qualifies', () => {
    const g = game([W6.blenheim, ON_PLAY.afterBlocker]);
    useAbility(g, leader(g));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W6.blenheim]);
  });

  it('an [On Play] that shares its line with [Blocker] or [Your Turn], or follows a static line, still counts as an [On Play] effect', () => {
    const g = game([
      ON_PLAY.gluedToBlocker,
      ON_PLAY.yourTurn,
      ON_PLAY.afterStatic,
      ON_PLAY.afterBlocker,
      V13.marco,
    ]);
    useAbility(g, leader(g));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.marco]);
  });

  it('boundary: cost 8 qualifies, cost 9 does not', () => {
    const g = game([W6.shiki8, W6.oden9, V13.hajrudin]);
    useAbility(g, leader(g));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.hajrudin, W6.shiki8].sort());
  });

  it('only my own Characters are offered', () => {
    const g = game([V13.sai], [V13.marco, V13.hajrudin]);
    useAbility(g, leader(g));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.sai]);
  });

  it("the chosen Character gains [Rush]: played this turn, it can attack the opponent's Leader at once; the others cannot", () => {
    const g = game([
      { card: V13.hajrudin, playedThisTurn: true },
      { card: V13.marco, playedThisTurn: true },
    ]);
    const a = at(g, 'p1', 'characters', V13.hajrudin);
    const b = at(g, 'p1', 'characters', V13.marco);
    expect(canAttackAnything(g, a)).toBe(false);
    useAbility(g, leader(g));
    pickCards(g, [V13.hajrudin]);
    expect(atMain(g), snap(g)).toBe(true);
    expect(kw(g, a)).toContain('Rush');
    expect(kw(g, b)).not.toContain('Rush');
    expect(canHit(g, a, g.leader('p2'))).toBe(true);
    expect(canAttackAnything(g, b)).toBe(false);
  });

  it('"up to 1": I may choose none, and then no Character gains [Rush]', () => {
    const g = game([{ card: V13.hajrudin, playedThisTurn: true }]);
    useAbility(g, leader(g));
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(kw(g, at(g, 'p1', 'characters', V13.hajrudin))).not.toContain('Rush');
    expect(canAttackAnything(g, at(g, 'p1', 'characters', V13.hajrudin))).toBe(false);
  });

  it('[Once Per Turn]: after one use the ability is not offered again this turn, but is on the next turn', () => {
    const g = game([V13.sai, V13.marco]);
    expect(offeredAbilities(g, leader(g))).toHaveLength(1);
    useAbility(g, leader(g));
    pickCards(g, [V13.sai]);
    expect(offeredAbilities(g, leader(g))).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, leader(g))).toHaveLength(1);
  });

  it('"during this turn": the [Rush] is gone on my next turn', () => {
    const g = game([V13.sai]);
    useAbility(g, leader(g));
    pickCards(g, [V13.sai]);
    expect(kw(g, at(g, 'p1', 'characters', V13.sai))).toContain('Rush');
    toMyNextMain(g);
    expect(kw(g, at(g, 'p1', 'characters', V13.sai))).not.toContain('Rush');
  });

  it('a Character played after the activation does not gain [Rush]', () => {
    const g = mine(SANJI, { characters: [V13.sai], hand: [V13.hajrudin] });
    useAbility(g, leader(g));
    pickCards(g, [V13.sai]);
    playRaw(g, V13.hajrudin);
    const h = at(g, 'p1', 'characters', V13.hajrudin);
    expect(kw(g, h)).not.toContain('Rush');
    expect(canAttackAnything(g, h)).toBe(false);
    expect(chars(g)).toEqual([V13.sai, V13.hajrudin].sort());
  });

  it("[Activate: Main] is for my Main Phase only: not offered on the opponent's turn", () => {
    const g = theirs(SANJI, { characters: [V13.sai] });
    expect(g.decider).toBe('p2');
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });
});
