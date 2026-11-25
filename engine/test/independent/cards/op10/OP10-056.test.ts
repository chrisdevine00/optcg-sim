/**
 * OP10-056 Mansherry (Character, Blue, cost 2, 0 power, Counter +1000, {Dressrosa}/{The Tontattas}).
 *
 * Card text: "[On Play] You may rest 1 of your "Dressrosa" type Leader or Stage cards, and return 1 of
 * your "Dressrosa" type Characters with a cost of 4 or more to the owner's hand: Return up to 1 of
 * your opponent's Characters with a cost of 4 or less to the owner's hand."
 *
 * Rules: CR 8-3-1-4 ("you may" cost: both parts are paid or the effect is not used), a cost of "4 or
 * more" and "4 or less" include 4, "up to" may be 0 (CR 8-1-2), returned cards go to their owner's hand.
 * Scenery: EB03-030 Viola (Dressrosa, cost 5), OP13-090 Hack (Dressrosa, cost 6), OP10-054 Blue Gilly
 * (Dressrosa, cost 3), OP02-006 Kingdew (not Dressrosa, cost 5); EB01-040 Kyros as the {Dressrosa} Leader.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  C10,
  choices,
  decision,
  doneRaw,
  expectMain,
  hand,
  inst,
  L10,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  pickRaw,
  playRaw,
  STAGE_OTHER,
  X10,
  zoneIds,
} from './kit-op10b.ts';

const MANS = 'OP10-056';
const R = (card: string) => ({ card, rested: true });

function start(
  p1chars: (string | { card: string; rested: boolean })[],
  p2chars: string[] = [C10.hajrudin4],
  leader: string | { card: string; rested: boolean } = L10.dressrosa,
  stage?: string,
) {
  return mine(
    leader,
    { hand: [MANS], characters: p1chars, ...(stage ? { stage } : {}) },
    { characters: p2chars },
  );
}

/**
 * Pay the two-part cost: return the Character `ret` (a card id), rest the Leader or Stage (`rest`),
 * answering whichever cost pick is pending (a sole candidate is paid by the engine).
 */
function payParts(g: TestGame, o: { ret?: string; rest?: 'leader' | 'stage' }) {
  for (let i = 0; i < 4; i++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.purpose !== 'cost' || d.player !== 'p1') return;
    const offered = choices(g);
    const pick = offered.find((x) => {
      if (o.ret && g.card(x).card === o.ret) return true;
      if (o.rest === 'leader' && x === g.leader('p1')) return true;
      if (o.rest === 'stage' && g.zone('p1', 'stage')[0]?.instance === x) return true;
      return false;
    });
    if (!pick) throw new Error(`no wanted cost candidate among ${offeredNow(g)}`);
    act(g, { type: 'pick', choice: pick });
  }
}
const use = (g: TestGame) => {
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: true });
};
const leaderRested = (g: TestGame) => g.card(g.leader('p1')).rested;

describe('OP10-056 Mansherry: [On Play] rest my {Dressrosa} Leader/Stage and return my {Dressrosa} Character (cost 4+): return an opposing Character (cost 4 or less)', () => {
  it("pays both parts and returns the opposing cost-4 Character to its owner's hand", () => {
    const g = start([C10.viola]);
    playRaw(g, MANS);
    use(g);
    payParts(g, { ret: C10.viola });
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.hajrudin4));
    expectMain(g);
    expect(leaderRested(g)).toBe(true);
    expect(hand(g, 'p1')).toEqual([C10.viola]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([MANS]);
    expect(hand(g, 'p2')).toEqual([C10.hajrudin4]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
  });

  it('the return cost offers only {Dressrosa} Characters with a cost of 4 or more (cost 3, other types and Mansherry herself are not)', () => {
    const g = start([C10.viola, C10.hack6, C10.gilly, C10.kingdew]);
    playRaw(g, MANS);
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.hack6, C10.viola].sort());
  });

  it('the target pick offers cost 4 or less only: a cost-5 Character is not offered', () => {
    const g = start([C10.viola], [C10.hajrudin4, C10.kingdew, C10.mohji]);
    playRaw(g, MANS);
    use(g);
    payParts(g, { ret: C10.viola });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.hajrudin4, C10.mohji].sort());
  });

  it('"up to 1": choosing nobody still pays the whole cost', () => {
    const g = start([C10.viola]);
    playRaw(g, MANS);
    use(g);
    payParts(g, { ret: C10.viola });
    need(g, 'choose', 'p1');
    doneRaw(g);
    expectMain(g);
    expect(leaderRested(g)).toBe(true);
    expect(hand(g, 'p1')).toEqual([C10.viola]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.hajrudin4]);
  });

  it('"you may": declining pays nothing: the Leader stays active, the Character stays and nothing returns', () => {
    const g = start([C10.viola]);
    playRaw(g, MANS);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expectMain(g);
    expect(leaderRested(g)).toBe(false);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([C10.viola, MANS].sort());
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.hajrudin4]);
  });

  it('without a {Dressrosa} Character of cost 4 or more the cost cannot be paid, and the Leader is not rested for nothing', () => {
    const g = start([C10.gilly, C10.kingdew]);
    playRaw(g, MANS);
    mustBeUnpayable(g, 'p1');
    expectMain(g);
    expect(leaderRested(g)).toBe(false);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.hajrudin4]);
  });

  it('with a non-{Dressrosa} Leader and no {Dressrosa} Stage the cost cannot be paid, and the Character stays', () => {
    const g = start([C10.viola], [C10.hajrudin4], L10.luffy);
    playRaw(g, MANS);
    mustBeUnpayable(g, 'p1');
    expectMain(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([C10.viola, MANS].sort());
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.hajrudin4]);
  });

  it('a rested {Dressrosa} Leader cannot pay: the cost cannot be paid', () => {
    const g = start([C10.viola], [C10.hajrudin4], R(L10.dressrosa));
    playRaw(g, MANS);
    mustBeUnpayable(g, 'p1');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([C10.viola, MANS].sort());
  });

  it('a {Dressrosa} Stage can be the rested card with a non-{Dressrosa} Leader', () => {
    const g = start([C10.viola], [C10.hajrudin4], L10.luffy, X10.coliseum);
    playRaw(g, MANS);
    use(g);
    payParts(g, { ret: C10.viola, rest: 'stage' });
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.hajrudin4));
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(leaderRested(g)).toBe(false);
    expect(hand(g, 'p2')).toEqual([C10.hajrudin4]);
  });

  it('a Stage without the {Dressrosa} type does not pay', () => {
    const g = start([C10.viola], [C10.hajrudin4], L10.luffy, STAGE_OTHER);
    playRaw(g, MANS);
    mustBeUnpayable(g, 'p1');
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(false);
  });

  it('a rested {Dressrosa} Character of cost 4 or more can be the one returned', () => {
    const g = start([R(C10.viola)]);
    playRaw(g, MANS);
    use(g);
    payParts(g, { ret: C10.viola });
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.hajrudin4));
    expect(hand(g, 'p1')).toEqual([C10.viola]);
  });
});
