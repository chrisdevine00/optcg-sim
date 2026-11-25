/**
 * ST16-005 Monkey.D.Luffy (Character, cost 2, 3000, Counter +2000, {FILM}/{Straw Hat Crew}/
 * {Supernovas}).
 *
 * Card text: "If you have a rested [Uta], this Character gains +1000 power."
 *
 * Rules: a permanent effect (CR 8-1-3-3) that holds on both turns. "A rested [Uta]" is a card of
 * mine on the field NAMED Uta that is rested, whatever its other text. My own cards only. The bonus is
 * a flat +1000 however many rested [Uta] there are.
 */
import { describe, expect, it } from 'vitest';
import { at, LDP, mine, need, SP, theirs, toMyNextMain } from './kit-prb02sta.ts';

const LU = 'ST16-005';
/** ST16-001 Uta: Green, cost 4, 6000, {FILM}, [Blocker]. */
const UTA = 'ST16-001';
/** OP09-002 Uta: Red, cost 1, 2000, {FILM}. Another card named [Uta]; its [On Play] does not fire from the scenario. */
const UTA2 = 'OP09-002';
/** OP02-043 Roronoa Zoro: {FILM}, not named Uta. */
const NOT_UTA = SP.filmChar;

type P = string | { card: string; rested?: boolean };

const pow = (g: ReturnType<typeof mine>) => g.power(at(g, 'p1', 'characters', LU));

function board(chars: P[], p2chars: P[] = []) {
  return mine(LDP.neutral, { characters: [LU, ...chars] }, { characters: p2chars });
}

describe('ST16-005 Luffy: with a rested [Uta], +1000 power', () => {
  it('printed values: cost 2, 3000 power, Counter +2000', () => {
    const g = board([]);
    const i = at(g, 'p1', 'characters', LU);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([2, 3000, 2000]);
  });

  it('no [Uta] at all: 3000', () => {
    expect(pow(board([SP.c1p3]))).toBe(3000);
  });

  it('an ACTIVE [Uta]: 3000, no bonus', () => {
    expect(pow(board([UTA]))).toBe(3000);
  });

  it('a RESTED [Uta]: 4000', () => {
    expect(pow(board([{ card: UTA, rested: true }]))).toBe(4000);
  });

  it('any card named [Uta] counts, not only this printing (OP09-002 Uta rested: 4000)', () => {
    expect(pow(board([{ card: UTA2, rested: true }]))).toBe(4000);
  });

  it('a rested Character with another name (a {FILM} Zoro) does not count', () => {
    expect(pow(board([{ card: NOT_UTA, rested: true }]))).toBe(3000);
  });

  it('two rested [Uta]: still only +1000 (4000)', () => {
    expect(
      pow(
        board([
          { card: UTA, rested: true },
          { card: UTA2, rested: true },
        ]),
      ),
    ).toBe(4000);
  });

  it("only my own [Uta] counts: a rested [Uta] on the opponent's side gives nothing", () => {
    expect(pow(board([], [{ card: UTA, rested: true }]))).toBe(3000);
  });

  it('a [Uta] in hand does not count', () => {
    const g = mine(LDP.neutral, { characters: [LU], hand: [UTA] });
    expect(pow(g)).toBe(3000);
  });

  it("it also holds on the opponent's turn (rested Uta: 4000)", () => {
    const g = theirs(LDP.neutral, { characters: [LU, { card: UTA, rested: true }] });
    expect(g.power(at(g, 'p1', 'characters', LU))).toBe(4000);
  });

  it("the bonus follows the Uta's state: she becomes active in my Refresh Phase, so on my next turn it is gone", () => {
    const g = board([{ card: UTA, rested: true }]);
    expect(pow(g)).toBe(4000);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(g.card(at(g, 'p1', 'characters', UTA)).rested).toBe(false);
    expect(pow(g)).toBe(3000);
  });
});
