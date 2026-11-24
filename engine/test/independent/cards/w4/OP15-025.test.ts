/**
 * OP15-025 Kuro (Character, Green, cost 7, 7000, Counter +1000, [Blocker], {East Blue}/{Black Cat
 * Pirates}).
 *
 * Card text: "[Blocker] [On Play] Give up to 2 DON!! cards from your opponent's cost area to 1 of your
 * opponent's Characters. Then, at the end of this turn, up to 1 rested Character with 3 or more
 * DON!! cards given will not become active in your opponent's next Refresh Phase."
 *
 * Rules: CR 6-2 (Refresh Phase: given DON!! return rested, then rested cards become active),
 * CR 8-4-4-1 ("up to"). Unlike Krieg, the DON!! come from the cost area, active or rested.
 * Not asserted: whether the "up to 1 rested Character" is chosen when the effect resolves or at the
 * end of the turn (every test sets the position up so both readings pick from the same cards).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  blockers,
  chr,
  donW,
  giveCount,
  giveDonFlow,
  asksCount,
  givenTo,
  kind,
  maxCount,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  theirsW,
  W4,
  at,
  attack,
  endTurn,
} from './kit-w4a.ts';

const KURO = 'OP15-025';

type P2 = Parameters<typeof mine>[2];
type Pl = string | { card: string; rested?: boolean; don?: number };

function board(characters: Pl[], costArea = { active: 2, rested: 0 }, extra: P2 = {}) {
  return mine('ST01-001', { hand: [KURO] }, { characters, costArea, ...extra });
}

/** Plays Kuro giving `n` DON!! to `target`; stops at the next prompt after that. */
function playGiving(g: ReturnType<typeof board>, n: number, target: string) {
  playRaw(g, KURO);
  giveDonFlow(g, n, chr(g, 'p2', target));
}

describe('OP15-025 Kuro: [Blocker] and [On Play] give up to 2 DON!! from the cost area', () => {
  it('printed values: cost 7, 7000 power, Counter +1000, [Blocker]', () => {
    const g = board([W4.marco]);
    const c = g.card(at(g, 'p1', 'hand', KURO));
    expect(c.cost).toBe(7);
    expect(c.counter).toBe(1000);
    playRaw(g, KURO);
    expect(g.power(chr(g, 'p1', KURO))).toBe(7000);
    expect(g.card(chr(g, 'p1', KURO)).keywords).toContain('Blocker');
  });

  it('asks a count (most first, up to 2) then the target; both ACTIVE DON!! of the cost area can be given', () => {
    const g = board([W4.marco, W4.kingdew], { active: 2, rested: 0 });
    playRaw(g, KURO);
    expect(maxCount(g)).toBe(2);
    giveCount(g, 2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.kingdew, W4.marco].sort());
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    expect(givenTo(g, chr(g, 'p2', W4.kingdew))).toBe(2);
    expect(donW(g, 'p2')).toMatchObject({ active: 0, rested: 0, given: 2 });
  });

  it('rested DON!! of the cost area can be given as well (1 active + 1 rested)', () => {
    const g = board([W4.marco], { active: 1, rested: 1 });
    playGiving(g, 2, W4.marco);
    expect(givenTo(g, chr(g, 'p2', W4.marco))).toBe(2);
    expect(donW(g, 'p2')).toMatchObject({ active: 0, rested: 0, given: 2 });
  });

  it('boundary: with only 1 DON!! in the cost area no count is asked and 1 is given', () => {
    const g = board([W4.marco, W4.kingdew], { active: 0, rested: 1 });
    playRaw(g, KURO);
    expect(asksCount(g)).toBe(false);
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    expect(donW(g, 'p2')).toMatchObject({ active: 0, rested: 0, given: 1 });
    expect(givenTo(g, chr(g, 'p2', W4.kingdew))).toBe(1);
  });

  it('"up to 2": giving 1 leaves the rest in the cost area', () => {
    const g = board([W4.marco], { active: 3, rested: 0 });
    playGiving(g, 1, W4.marco);
    expect(donW(g, 'p2')).toMatchObject({ active: 2, given: 1 });
  });

  it('DON!! already given to a card (here the Leader) are not in the cost area and are not taken', () => {
    const g = board(
      [W4.marco, W4.kingdew],
      { active: 1, rested: 0 },
      { leader: { card: W4.luffy, don: 2 } },
    );
    playRaw(g, KURO);
    expect(asksCount(g)).toBe(false);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(givenTo(g, g.leader('p2'))).toBe(2);
    expect(givenTo(g, chr(g, 'p2', W4.marco))).toBe(1);
    expect(donW(g, 'p2')).toMatchObject({ active: 0, given: 3 });
  });

  it("the target pick lists the opponent's Characters, not their Leader", () => {
    const g = board([W4.marco, W4.kingdew]);
    playRaw(g, KURO);
    giveCount(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.kingdew, W4.marco].sort());
  });

  it('given DON!! add no power on my turn', () => {
    const g = board([W4.marco]);
    playGiving(g, 2, W4.marco);
    expect(g.power(chr(g, 'p2', W4.marco))).toBe(5000);
  });
});

describe('OP15-025 Kuro: a rested Character with 3+ DON!! does not become active in the next Refresh', () => {
  const A = W4.marco;
  const B = W4.kingdew;
  const E = W4.hajrudin;

  /** A rested with 3 DON!!, B rested with 2, E rested with 1 (Kuro gives it 2: 3). */
  function setup() {
    const g = board([
      { card: A, rested: true, don: 3 },
      { card: B, rested: true, don: 2 },
      { card: E, rested: true, don: 1 },
    ]);
    playGiving(g, 2, E);
    return g;
  }

  /** End my turn and answer the "up to 1" pick with `pick` (or nothing); stops at p2's Main Phase. */
  function endMine(g: ReturnType<typeof board>, pick: string | null) {
    endTurn(g);
    if (kind(g) === 'choose') {
      if (pick) pickInst(g, [chr(g, 'p2', pick)]);
      else none(g);
    }
    need(g, 'main', 'p2');
  }

  it('offers, at the end of the turn, only the rested Characters with 3 or more DON!! (2 no, 3 yes, 1+2 given yes)', () => {
    const g = setup();
    endTurn(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([A, E].sort());
  });

  it('the chosen Character stays rested through the next Refresh; the others become active', () => {
    const g = setup();
    endMine(g, A);
    expect(g.card(chr(g, 'p2', A)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', B)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', E)).rested).toBe(false);
  });

  it('"up to 1": with two candidates only the chosen one is held', () => {
    const g = setup();
    endMine(g, E);
    expect(g.card(chr(g, 'p2', E)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', A)).rested).toBe(false);
  });

  it('choosing nobody holds nobody', () => {
    const g = setup();
    endMine(g, null);
    expect(g.card(chr(g, 'p2', A)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', E)).rested).toBe(false);
  });

  it('boundary: a rested Character with only 2 DON!! given becomes active as usual', () => {
    const g = board([
      { card: B, rested: true, don: 2 },
      { card: A, rested: true, don: 3 },
    ]);
    playGiving(g, 1, A);
    endMine(g, A);
    expect(g.card(chr(g, 'p2', B)).rested).toBe(false);
  });

  it('only the NEXT Refresh: one turn cycle later the Character is active again', () => {
    const g = setup();
    endMine(g, A);
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', A)).rested).toBe(false);
  });

  it('with no rested Character holding 3 DON!! nothing is held and no prompt hides it', () => {
    const g = board([{ card: B, rested: true, don: 2 }, W4.sai]);
    playGiving(g, 1, W4.sai);
    endTurn(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', B)).rested).toBe(false);
  });
});

describe('OP15-025 Kuro: [Blocker]', () => {
  it('can block an attack on its owner', () => {
    const g = theirsW({ characters: [KURO] }, { characters: [W4.marco] });
    attack(g, chr(g, 'p2', W4.marco), g.leader('p1'));
    expect(blockers(g)).toEqual([chr(g, 'p1', KURO)]);
    passBlock(g);
    expect(atMain(g, 'p2') || kind(g) === 'counter').toBe(true);
  });
});
