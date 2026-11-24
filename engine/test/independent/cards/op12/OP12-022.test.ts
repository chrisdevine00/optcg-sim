/**
 * OP12-022 Inuarashi (Character, Green, cost 6, 7000, Counter +1000, {Land of Wano} {Minks} {The
 * Akazaya Nine}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Up to 1 of your opponent's rested
 * Characters with a cost of 5 or less will not become active in your opponent's next Refresh
 * Phase."
 *
 * Rules: resting this Character is the cost, so it must be active; the target must be rested and
 * its current cost 5 or less when the effect is chosen; the Refresh Phase is the first phase of the
 * opponent's turn (CR 6-2); "next" covers one Refresh Phase only, so the Character becomes active
 * in the one after; "up to 1" may be 0.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  chr,
  cutAll,
  kind,
  LD12,
  mine,
  need,
  none,
  offeredCardIds,
  offeredOn,
  pickInst,
  S12,
  startActivate,
} from './kit-op12a.ts';

const INU = 'OP12-022';

type P = string | { card: string; rested?: boolean };

function board(p2: P[], hand: string[] = []) {
  return mine(LD12.luffy, { hand, characters: [INU] }, { characters: p2 });
}

const rested = (card: string): P => ({ card, rested: true });

function inu(g: ReturnType<typeof board>) {
  return chr(g, 'p1', INU);
}

/** End p1's turn: p2's Refresh Phase has run when p2's Main Phase starts. */
function intoOpponentTurn(g: ReturnType<typeof board>) {
  act(g, { type: 'endTurn' });
  need(g, 'main', 'p2');
}

describe('OP12-022 Inuarashi: rest this: an opponent rested Character (cost 5 or less) stays rested next Refresh Phase', () => {
  it('printed values: cost 6, 7000, Counter +1000', () => {
    const g = board([]);
    const c = g.card(inu(g));
    expect([c.cost, c.power, c.counter]).toEqual([6, 7000, 1000]);
  });

  it('offers exactly the opponent rested Characters of cost 5 or less (cost 5 yes, 6 no, active no)', () => {
    const g = board([rested(S12.kingdew), rested(S12.thatch), rested(S12.sai), S12.marco]);
    startActivate(g, inu(g));
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.kingdew, S12.sai].sort());
  });

  it('the chosen Character is still rested after the opponent Refresh Phase, an unchosen one wakes up', () => {
    const g = board([rested(S12.kingdew), rested(S12.sai)]);
    startActivate(g, inu(g));
    pickInst(g, [chr(g, 'p2', S12.kingdew)]);
    expect(g.card(inu(g)).rested).toBe(true);
    intoOpponentTurn(g);
    expect(g.card(chr(g, 'p2', S12.kingdew)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S12.sai)).rested).toBe(false);
  });

  it('only the next Refresh Phase: it becomes active in the one after', () => {
    const g = board([rested(S12.kingdew)]);
    startActivate(g, inu(g));
    pickInst(g, [chr(g, 'p2', S12.kingdew)]);
    intoOpponentTurn(g);
    expect(g.card(chr(g, 'p2', S12.kingdew)).rested).toBe(true);
    act(g, { type: 'endTurn' }); // p2 ends; p1 refreshes
    need(g, 'main', 'p1');
    act(g, { type: 'endTurn' }); // p1 ends; p2 refreshes again
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', S12.kingdew)).rested).toBe(false);
  });

  it('"up to 1": choosing nothing keeps nothing rested, and Inuarashi is still rested (cost paid)', () => {
    const g = board([rested(S12.kingdew)]);
    startActivate(g, inu(g));
    none(g);
    expect(g.card(inu(g)).rested).toBe(true);
    intoOpponentTurn(g);
    expect(g.card(chr(g, 'p2', S12.kingdew)).rested).toBe(false);
  });

  it('only one Character is kept rested when two qualify', () => {
    const g = board([rested(S12.kingdew), rested(S12.sai)]);
    startActivate(g, inu(g));
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    intoOpponentTurn(g);
    expect(g.card(chr(g, 'p2', S12.sai)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S12.kingdew)).rested).toBe(false);
  });

  it('cost is the current cost: a cost-6 Character lowered to 5 by an effect this turn qualifies, a lowered cost-7 one does not', () => {
    const g = mine(
      LD12.luffy,
      { hand: [S12.cutAll], characters: [INU] },
      { characters: [rested(S12.thatch), rested(S12.oars)] },
    );
    cutAll(g);
    expect(g.card(chr(g, 'p2', S12.thatch)).cost).toBe(5);
    startActivate(g, inu(g));
    need(g, 'choose', 'p1');
    // Thatch: printed 6, now 5; Oars: printed 7, now 6
    expect(offeredCardIds(g)).toEqual([S12.thatch]);
  });

  it('with no qualifying Character nothing is kept rested (the rested cost-6 Character wakes up)', () => {
    const g = board([rested(S12.thatch), S12.sai]);
    if (offeredOn(g, inu(g)).length > 0) {
      startActivate(g, inu(g));
      if (kind(g) === 'choose') {
        expect(offeredCardIds(g)).toEqual([]);
        none(g);
      }
    }
    intoOpponentTurn(g);
    expect(g.card(chr(g, 'p2', S12.thatch)).rested).toBe(false);
  });

  it('must not: not offered while Inuarashi is already rested (resting is the cost)', () => {
    const g = mine(
      LD12.luffy,
      { characters: [{ card: INU, rested: true }] },
      { characters: [rested(S12.sai)] },
    );
    expect(offeredOn(g, chr(g, 'p1', INU))).toEqual([]);
  });

  it('must not: nothing happens to the opponent immediately (the target is still rested, others unchanged)', () => {
    const g = board([rested(S12.sai), S12.marco]);
    startActivate(g, inu(g));
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    expect(g.card(chr(g, 'p2', S12.sai)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S12.marco)).rested).toBe(false);
    expect(kind(g)).toBe('main');
  });
});
