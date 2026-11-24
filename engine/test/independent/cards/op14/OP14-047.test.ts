/**
 * OP14-047 Shirahoshi (Character, Blue, cost 4, 0 power, Counter +1000, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[Blocker]
 * [On Play] Draw 1 card and play up to 1 {Fish-Man} or {Merfolk} type Character card with a cost of
 * 3 or less from your hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 4-8-1 ("up to"), CR 2-7-2 (an effect play costs no DON!!),
 * CR 8-2 (the instructions of an effect resolve in order, so the drawn card is in hand when the
 * play is chosen).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  blockers,
  C14,
  canFinish,
  chars,
  choices,
  deck,
  don,
  hand,
  inst,
  kw,
  L14,
  mine,
  need,
  offeredIds,
  pickCards,
  put,
  reachablePickSets,
  theirs,
} from './kit-op14b.ts';

const SHI = 'OP14-047';

function start(handExtra: string[], top: string[]) {
  return mine(L14.luffy, { hand: [SHI, ...handExtra], deck: [...top, BLUE, BLUE, BLUE] });
}

describe('OP14-047 Shirahoshi: [Blocker]; [On Play] draw 1 and play a {Fish-Man}/{Merfolk} Character of cost 3 or less from hand', () => {
  it('draws first: the card just drawn (a {Merfolk} of cost 1) can be the one played', () => {
    const g = start([], [C14.camie]);
    put(g, SHI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.camie]);
    pickCards(g, [C14.camie]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([C14.camie, SHI].sort());
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(3);
  });

  it('plays a {Fish-Man} Character of cost 3 from the old hand; the drawn card stays in hand', () => {
    const g = start([C14.namule], [C14.kingdew]);
    put(g, SHI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.namule]);
    pickCards(g, [C14.namule]);
    expect(hand(g)).toEqual([C14.kingdew]);
    expect(chars(g)).toEqual([C14.namule, SHI].sort());
  });

  it('boundary: {Fish-Man} of cost 4 and {Merfolk} of cost 5 are not offered, a {Merfolk} of cost 3 is', () => {
    const g = start([C14.jinbe4, C14.ryuboshi, C14.praline], [BLUE]);
    put(g, SHI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.praline]);
  });

  it('the draw happens even when nothing can be played, and the play pick is still asked (with no candidates)', () => {
    const g = start([C14.marco, C14.jinbe4], [C14.kingdew]);
    put(g, SHI);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(0);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(hand(g)).toEqual([C14.marco, C14.jinbe4, C14.kingdew].sort());
  });

  it('draws exactly 1 card', () => {
    const g = start([C14.namule], [C14.kingdew, C14.thatch]);
    put(g, SHI);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(deck(g)).toHaveLength(4);
    expect(hand(g)).toEqual([C14.namule, C14.kingdew].sort());
  });

  it('"up to 1": may play nothing', () => {
    const g = start([C14.namule], [C14.kingdew]);
    put(g, SHI);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(chars(g)).toEqual([SHI]);
  });

  it('plays at most one Character', () => {
    const g = start([C14.namule, C14.camie], [C14.praline]);
    put(g, SHI);
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it("the played Character costs no DON!!: only Shirahoshi's 4 DON!! are rested", () => {
    const g = start([C14.namule], [BLUE]);
    put(g, SHI);
    need(g, 'choose', 'p1');
    pickCards(g, [C14.namule]);
    expect(don(g)).toMatchObject({ active: 6, rested: 4 });
  });

  it('has [Blocker]', () => {
    const g = start([], [BLUE]);
    put(g, SHI);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(kw(g, inst(g, 'p1', 'characters', SHI))).toContain('Blocker');
  });

  it('can block an attack on the Leader', () => {
    const g = theirs(L14.luffy, { characters: [SHI] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', SHI)]);
    passBlock(g);
  });
});
