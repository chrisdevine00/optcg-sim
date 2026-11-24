/**
 * OP14-005 Killer (Character, cost 1, 1000, Counter +1000, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to your Leader or 1 of
 * your Characters."
 *
 * Rules: giving DON!! (CR 6-5-5): a DON!! card given to a Leader or Character is +1000 power during
 * its owner's turn; only the owner's Leader and Characters can receive (RL-35). "Up to" lets the
 * player give none (CR 8-4-4-1). An [Activate: Main] has no summoning-sickness restriction (CR 3-7-4
 * concerns attacking only). [Once Per Turn] is once per turn per card (CR 8-1-3-2).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
  donOf,
  kind,
  LD14,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  S14,
  tryActivate,
  useAbility,
} from './kit-op14a.ts';

const KILLER = 'OP14-005';

function board(
  active: number,
  rested: number,
  chars: (string | { card: string; playedThisTurn?: boolean; rested?: boolean })[] = [
    KILLER,
    S14.marco,
  ],
) {
  return mine(
    LD14.luffy,
    { costArea: { active, rested }, characters: chars },
    { characters: [S14.sai] },
  );
}

describe('OP14-005 Killer: [Activate: Main] [Once Per Turn] give up to 1 rested DON!!', () => {
  it('printed values: cost 1, 1000, Counter +1000', () => {
    const g = board(5, 2);
    const k = at(g, 'p1', 'characters', KILLER);
    expect(g.card(k).cost).toBe(1);
    expect(g.power(k)).toBe(1000);
    expect(g.card(k).counter).toBe(1000);
  });

  it('gives 1 rested DON!! to the chosen Character: +1000 power, one fewer rested DON!! in the cost area', () => {
    const g = board(5, 2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 2, given: 0 });
    useAbility(g, at(g, 'p1', 'characters', KILLER));
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', S14.marco)]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 1, given: 1 });
    expect(g.power(chr(g, 'p1', S14.marco))).toBe(6000);
    need(g, 'main', 'p1');
  });

  it('may give it to my Leader (+1000 on my turn)', () => {
    const g = board(5, 1);
    useAbility(g, at(g, 'p1', 'characters', KILLER));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 0, given: 1 });
  });

  it("offers exactly my Leader and my own Characters (Killer included), never the opponent's cards", () => {
    const g = board(5, 1);
    useAbility(g, at(g, 'p1', 'characters', KILLER));
    need(g, 'choose', 'p1');
    const offered = offeredIds(g);
    expect(offered).toEqual([LD14.luffy, KILLER, S14.marco].sort());
    expect(offered).not.toContain(S14.sai);
  });

  it('gives only 1 DON!! even with 3 rested DON!! available', () => {
    const g = board(4, 3);
    useAbility(g, at(g, 'p1', 'characters', KILLER));
    pickInst(g, [chr(g, 'p1', S14.marco)]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 1 });
  });

  it('"up to 1": choosing nothing gives no DON!!', () => {
    const g = board(5, 2);
    useAbility(g, at(g, 'p1', 'characters', KILLER));
    need(g, 'choose', 'p1');
    none(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 2, given: 0 });
  });

  it('only a RESTED DON!! is given: with no rested DON!! the active ones stay in the cost area', () => {
    const g = board(6, 0);
    const k = at(g, 'p1', 'characters', KILLER);
    if (tryActivate(g, k)) {
      // The engine may let the activation resolve to nothing; whatever it asks, nothing is given.
      if (kind(g) === 'choose') {
        if (offeredIds(g).length) pickInst(g, [chr(g, 'p1', S14.marco)]);
        else none(g);
      }
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 0, given: 0 });
    expect(g.power(chr(g, 'p1', S14.marco))).toBe(5000);
  });

  it('[Once Per Turn]: after one use it is not offered again, even with another rested DON!!', () => {
    const g = board(4, 3);
    const k = at(g, 'p1', 'characters', KILLER);
    useAbility(g, k);
    pickInst(g, [chr(g, 'p1', S14.marco)]);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, k)).toEqual([]);
  });

  it('a Killer played this turn can use it at once (no summoning sickness for [Activate: Main])', () => {
    const g = board(5, 2, [{ card: KILLER, playedThisTurn: true }, S14.marco]);
    const k = at(g, 'p1', 'characters', KILLER);
    expect(offeredAbilities(g, k)).toHaveLength(1);
    useAbility(g, k);
    pickInst(g, [k]);
    expect(g.power(k)).toBe(2000);
  });

  it('a rested Killer can still use it (the ability has no rest cost)', () => {
    const g = board(5, 2, [{ card: KILLER, rested: true }, S14.marco]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', KILLER))).toHaveLength(1);
  });
});
