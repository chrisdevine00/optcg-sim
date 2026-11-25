/**
 * OP10-033 Nami (Character, Green, cost 2, 2000, Counter +2000, {Straw Hat Crew}/{ODYSSEY}, Special).
 *
 * Card text: "[On Play] If you have 2 or more rested "ODYSSEY" type Characters, up to 1 of your
 * opponent's rested DON!! cards will not become active in your opponent's next Refresh Phase."
 *
 * Rules: the colon-less "If" is an effect condition checked when the effect resolves; Nami enters
 * the field active, so she does not count herself; a quoted type is an exact type (DECISIONS
 * 2026-11-25); "up to 1" is at most one DON!!; the hold lasts one Refresh Phase (CR 6-2).
 * M6b-Q69 (open): the engine reads this for rested cost-area DON!! only and does not ask which one;
 * the tests count DON!! by state, which every reading shares.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import { at, atMain, don, mine, need, playRaw, takeMost, kind, type Place } from './kit-w5b.ts';

const NAMI = 'OP10-033';
/** OP09-038 Rob Lucci: Green, cost 4, 6000, {CP9}/{ODYSSEY}, vanilla. */
const LUCCI = 'OP09-038';
/** OP03-015 Lim: Red, cost 3, 2000, {ODYSSEY}, [Blocker] only. */
const LIM = 'OP03-015';
/** OP01-012 Sai: Red, cost 2, 4000, not ODYSSEY. */
const SAI = 'OP01-012';

/** p1 holds Nami and has `chars`; p2 has `active` and `rested` DON!! in the cost area. */
function board(chars: Place[], rested = 3, active = 2) {
  return mine(
    'ST01-001',
    { hand: [NAMI], characters: chars, costArea: { active: 5, rested: 0 } },
    { costArea: { active, rested } },
  );
}

/** Play Nami, settle a count prompt if one is asked, and pass the turn to p2's Main Phase. */
function playAndPass(g: ReturnType<typeof board>) {
  playRaw(g, NAMI);
  takeMost(g);
  expect(atMain(g)).toBe(true);
  act(g, { type: 'endTurn' });
  need(g, 'main', 'p2');
}

const two = [
  { card: LUCCI, rested: true },
  { card: LUCCI, rested: true },
];

describe('OP10-033 Nami: [On Play] with 2+ rested ODYSSEY Characters, 1 of their rested DON!! stays rested next Refresh', () => {
  it('printed values: cost 2, 2000 power, Counter +2000', () => {
    const g = board(two);
    const c = g.card(at(g, 'p1', 'hand', NAMI));
    expect(c.cost).toBe(2);
    playRaw(g, NAMI);
    takeMost(g);
    const n = g.card(at(g, 'p1', 'characters', NAMI));
    expect(g.power(n.instance)).toBe(2000);
    expect(n.counter).toBe(2000);
  });

  it('with 2 rested ODYSSEY Characters, one of their 3 rested DON!! does not become active at their Refresh', () => {
    const g = board(two, 3, 2);
    playAndPass(g);
    // 5 DON!! refreshed except 1, then the 2 new DON!! of their DON!! Phase come in active.
    expect(don(g, 'p2')).toMatchObject({ active: 6, rested: 1 });
  });

  it('control: without the condition the same Refresh makes every DON!! active', () => {
    const g = board([{ card: LUCCI, rested: true }], 3, 2);
    playAndPass(g);
    expect(don(g, 'p2')).toMatchObject({ active: 7, rested: 0 });
  });

  it('boundary: exactly 1 rested ODYSSEY Character is not enough (Nami herself enters active)', () => {
    const g = board([{ card: LUCCI, rested: true }, { card: LIM }], 3, 2);
    playAndPass(g);
    expect(don(g, 'p2').rested).toBe(0);
  });

  it('an ODYSSEY Character that is active does not count', () => {
    const g = board([{ card: LUCCI, rested: true }, LUCCI], 3, 2);
    playAndPass(g);
    expect(don(g, 'p2').rested).toBe(0);
  });

  it('a rested Character that is not ODYSSEY does not count', () => {
    const g = board(
      [
        { card: LUCCI, rested: true },
        { card: SAI, rested: true },
      ],
      3,
      2,
    );
    playAndPass(g);
    expect(don(g, 'p2').rested).toBe(0);
  });

  it('different ODYSSEY names count together (Lucci and Lim)', () => {
    const g = board(
      [
        { card: LUCCI, rested: true },
        { card: LIM, rested: true },
      ],
      3,
      2,
    );
    playAndPass(g);
    expect(don(g, 'p2')).toMatchObject({ active: 6, rested: 1 });
  });

  it('"up to 1": only one DON!! is held even with three ODYSSEY Characters and five rested DON!!', () => {
    const g = board(
      [
        { card: LUCCI, rested: true },
        { card: LUCCI, rested: true },
        { card: LIM, rested: true },
      ],
      5,
      0,
    );
    playAndPass(g);
    expect(don(g, 'p2')).toMatchObject({ active: 6, rested: 1 });
  });

  it('nothing to hold: with no rested DON!! the effect changes nothing and the game goes on', () => {
    const g = board(two, 0, 5);
    playAndPass(g);
    expect(don(g, 'p2')).toMatchObject({ active: 7, rested: 0 });
  });

  it('their active DON!! are untouched: only a rested one is held', () => {
    const g = board(two, 1, 4);
    playAndPass(g);
    expect(don(g, 'p2')).toMatchObject({ active: 6, rested: 1 });
  });

  it('only their next Refresh Phase: the held DON!! becomes active at the one after', () => {
    const g = board(two, 3, 2);
    playAndPass(g);
    expect(don(g, 'p2').rested).toBe(1);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(kind(g)).toBe('main');
    expect(don(g, 'p2').rested).toBe(0);
  });
});
