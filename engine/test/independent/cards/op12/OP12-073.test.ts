/**
 * OP12-073 Trafalgar Law (Character, Purple, cost 7, 8000, no Counter, {Heart Pirates}/{Supernovas}/
 * {Dressrosa}).
 *
 * Card text: "[On Play] If the number of DON!! cards on your field is equal to or less than the number
 * on your opponent's field, add up to 1 DON!! card from your DON!! deck and set it as active. Then,
 * all of your [Donquixote Rosinante] and "Heart Pirates" type Characters gain +1000 power until the
 * end of your opponent's next End Phase."
 *
 * Rules: DON!! on a field = cost area (active and rested) plus DON!! given, read when the effect
 * resolves (the DON!! that paid for Law is still on the field). A "Then" after an "If" that failed
 * does not resolve (M4b-5). "All of your" is every matching Character I have when it resolves,
 * Law included ("Heart Pirates" type); a Character that arrives later is not affected. The
 * duration set on my turn runs through the opponent's next turn and ends at its End Phase (RL-11).
 */
import { describe, expect, it } from 'vitest';
import {
  asksDonCount,
  cast,
  don,
  kind,
  LB,
  mine,
  need,
  SB,
  takeDon,
  toMyNextMain,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const LAW = 'OP12-073';
/** OP02-108 Donquixote Rosinante: Black, cost 2, 2000, [Blocker] only; named [Donquixote Rosinante]. */
const ROSI = 'OP02-108';
/** OP12-048 Donquixote Rosinante: Blue, cost 1, 1000; its only effect is an [Opponent's Turn] replacement. */
const ROSI_B = 'OP12-048';
/** ST02-012 Bepo: Green, cost 1, 3000, {Heart Pirates}/{Minks}. Vanilla. */
const BEPO = 'ST02-012';
/** OP01-045 Jean Bart: Green, cost 4, 6000, {Heart Pirates}. Vanilla. */
const JEAN = 'OP01-045';
/** EB04-038 Rosinante & Law: its name also counts as [Donquixote Rosinante] and [Trafalgar Law]. Types Donquixote Pirates/Navy. */
const BOTH = 'EB04-038';

function play(
  mineDon: number,
  theirDon: number,
  mineChars: string[],
  theirChars: string[] = [],
): TestGame {
  const g = mine(
    LB.croc,
    {
      hand: [LAW],
      characters: mineChars,
      costArea: { active: mineDon, rested: 0 },
    },
    { characters: theirChars, costArea: { active: theirDon, rested: 0 } },
  );
  cast(g, LAW);
  return g;
}

const pw = (g: TestGame, card: string, who: 'p1' | 'p2' = 'p1') =>
  g.power(g.find(who, 'characters', card));

describe('OP12-073 Trafalgar Law: [On Play] DON!! count not above theirs: add 1 active DON!!, then Rosinante / Heart Pirates +1000', () => {
  it('equal DON!! counts: add 1 DON!! active, then every [Donquixote Rosinante] and Heart Pirates Character gets +1000', () => {
    const g = play(7, 7, [ROSI, BEPO]);
    expect(asksDonCount(g)).toBe(true);
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ deck: 2, active: 1, rested: 7 });
    expect(pw(g, ROSI)).toBe(3000);
    expect(pw(g, BEPO)).toBe(4000);
  });

  it('Law is a Heart Pirates Character himself: he gets +1000 too (9000)', () => {
    const g = play(7, 8, []);
    takeDon(g, 1);
    expect(pw(g, LAW)).toBe(9000);
  });

  it('boundary: one DON!! more than the opponent: no DON!! is added and no power is given', () => {
    const g = play(7, 6, [ROSI, BEPO]);
    expect(asksDonCount(g)).toBe(false);
    expect(kind(g)).toBe('main');
    expect(don(g)).toMatchObject({ deck: 3, active: 0, rested: 7 });
    expect(pw(g, ROSI)).toBe(2000);
    expect(pw(g, BEPO)).toBe(3000);
    expect(pw(g, LAW)).toBe(8000);
  });

  it('only those Characters: a Character that is neither Heart Pirates nor named Rosinante is unchanged', () => {
    const g = play(7, 7, [SB.marco, ROSI]);
    takeDon(g, 1);
    expect(pw(g, SB.marco)).toBe(5000);
    expect(pw(g, ROSI)).toBe(3000);
  });

  it('must not: the opponent\'s Heart Pirates and Rosinante Characters get nothing ("your")', () => {
    const g = play(7, 7, [], [BEPO, ROSI]);
    takeDon(g, 1);
    expect(pw(g, BEPO, 'p2')).toBe(3000);
    expect(pw(g, ROSI, 'p2')).toBe(2000);
  });

  it('other Heart Pirates Characters and other versions named [Donquixote Rosinante] all count', () => {
    const g = play(7, 7, [JEAN, ROSI_B, SB.navyBlack1]);
    takeDon(g, 1);
    expect(pw(g, JEAN)).toBe(7000);
    expect(pw(g, ROSI_B)).toBe(2000);
    expect(pw(g, SB.navyBlack1)).toBe(3000);
  });

  it('a card whose name also counts as [Donquixote Rosinante] (Rosinante & Law) is included', () => {
    const g = play(7, 7, [BOTH]);
    takeDon(g, 1);
    expect(pw(g, BOTH)).toBe(9000);
  });

  it('"up to 1": answering 0 adds no DON!!', () => {
    const g = play(7, 7, [BEPO]);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ deck: 3, active: 0 });
  });

  it("the bonus lasts through the opponent's next turn and is gone at my following turn", () => {
    const g = play(7, 7, [BEPO]);
    takeDon(g, 1);
    need(g, 'main', 'p1');
    expect(pw(g, BEPO)).toBe(4000);
    toMyNextMain(g);
    expect(pw(g, BEPO)).toBe(3000);
    expect(pw(g, LAW)).toBe(8000);
  });

  it('a Character that arrives after the effect resolved does not get the bonus', () => {
    const g = mine(
      LB.croc,
      { hand: [LAW, BEPO], costArea: { active: 8, rested: 0 } },
      { costArea: { active: 8, rested: 0 } },
    );
    cast(g, LAW);
    takeDon(g, 1);
    cast(g, BEPO);
    expect(pw(g, BEPO)).toBe(3000);
  });
});
