/**
 * OP11-016 Roronoa Zoro (Character, Red, cost 5, 6000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to your Leader or 1 of
 * your Characters."
 *
 * Rules: giving DON!! (CR 6-5-5): a given DON!! is +1000 power during its owner's turn; only the
 * owner's Leader and Characters can receive. Only a RESTED DON!! qualifies. "Up to" lets the player
 * give none. [Once Per Turn] is once per turn per card (CR 8-1-3-2). An [Activate: Main] has no
 * summoning restriction.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
  donOf,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  tryActivate,
  useAbility,
} from './kit-op11a.ts';

const ZORO = 'OP11-016';

function board(
  active: number,
  rested: number,
  chars: (string | { card: string; playedThisTurn?: boolean; rested?: boolean })[] = [
    ZORO,
    N11.marco,
  ],
) {
  return mine(
    L11.luffy,
    { costArea: { active, rested }, characters: chars },
    { characters: [N11.sai] },
  );
}

describe('OP11-016 Roronoa Zoro: [Activate: Main] [Once Per Turn] give up to 1 rested DON!!', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = board(5, 2);
    const z = chr(g, 'p1', ZORO);
    expect(g.card(z).cost).toBe(5);
    expect(g.power(z)).toBe(6000);
    expect(g.card(z).counter).toBe(1000);
  });

  it('gives 1 rested DON!! to the chosen Character: +1000 power, one fewer rested DON!!', () => {
    const g = board(5, 2);
    useAbility(g, at(g, 'p1', 'characters', ZORO));
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', N11.marco)]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 1, given: 1 });
    expect(g.power(chr(g, 'p1', N11.marco))).toBe(6000);
  });

  it('may give it to my Leader (+1000 on my turn)', () => {
    const g = board(5, 1);
    useAbility(g, at(g, 'p1', 'characters', ZORO));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 0, given: 1 });
  });

  it('may give it to Zoro himself', () => {
    const g = board(5, 1);
    useAbility(g, at(g, 'p1', 'characters', ZORO));
    pickInst(g, [chr(g, 'p1', ZORO)]);
    expect(g.power(chr(g, 'p1', ZORO))).toBe(7000);
  });

  it('offers my Leader and my own Characters, never an opposing card', () => {
    const g = board(5, 1);
    useAbility(g, at(g, 'p1', 'characters', ZORO));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L11.luffy, ZORO, N11.marco].sort());
  });

  it('gives exactly 1 DON!! even with 3 rested DON!! available', () => {
    const g = board(4, 3);
    useAbility(g, at(g, 'p1', 'characters', ZORO));
    pickInst(g, [chr(g, 'p1', N11.marco)]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 1 });
  });

  it('"up to 1": choosing nothing gives no DON!!', () => {
    const g = board(5, 2);
    useAbility(g, at(g, 'p1', 'characters', ZORO));
    need(g, 'choose', 'p1');
    none(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 2, given: 0 });
  });

  it('with no rested DON!! the active ones are never given', () => {
    const g = board(6, 0);
    if (tryActivate(g, chr(g, 'p1', ZORO)) && kind(g) === 'choose') {
      if (offeredIds(g).length) pickInst(g, [chr(g, 'p1', N11.marco)]);
      else none(g);
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 0, given: 0 });
    expect(g.power(chr(g, 'p1', N11.marco))).toBe(5000);
  });

  it('[Once Per Turn]: not offered again after one use, even with another rested DON!!', () => {
    const g = board(4, 3);
    useAbility(g, at(g, 'p1', 'characters', ZORO));
    pickInst(g, [chr(g, 'p1', N11.marco)]);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, chr(g, 'p1', ZORO))).toEqual([]);
  });

  it('can be used the turn Zoro is played, and while he is rested', () => {
    const a = board(5, 2, [{ card: ZORO, playedThisTurn: true }, N11.marco]);
    expect(offeredAbilities(a, chr(a, 'p1', ZORO))).toHaveLength(1);
    const b = board(5, 2, [{ card: ZORO, rested: true }, N11.marco]);
    expect(offeredAbilities(b, chr(b, 'p1', ZORO))).toHaveLength(1);
  });
});
