/**
 * OP15-027 Dracule Mihawk (Character, Green, cost 4, 5000, Counter +2000, {The Seven Warlords of
 * the Sea}/{East Blue}).
 *
 * Card text: "[On Play] Rest up to 1 of your opponent's Characters with a DON!! card given."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 6-2 (a rested Character becomes active again in its owner's next
 * Refresh Phase). Not asserted: whether an already rested Character with a DON!! is offered.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  cardIds,
  chr,
  donW,
  givenTo,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  toMyNextMain,
  W4,
} from './kit-w4a.ts';

const MIHAWK = 'OP15-027';

type Pl = string | { card: string; rested?: boolean; don?: number };

function board(p2chars: Pl[], p2: Parameters<typeof mine>[2] = {}) {
  return mine('ST01-001', { hand: [MIHAWK] }, { characters: p2chars, ...p2 });
}

describe('OP15-027 Dracule Mihawk: [On Play] rest up to 1 Character with a DON!! given', () => {
  it('printed values: cost 4, 5000 power, Counter +2000', () => {
    const g = board([]);
    const c = g.card(at(g, 'p1', 'hand', MIHAWK));
    expect(c.cost).toBe(4);
    expect(c.counter).toBe(2000);
    playRaw(g, MIHAWK);
    expect(g.power(chr(g, 'p1', MIHAWK))).toBe(5000);
  });

  it('offers only active Characters that have a DON!! (1 DON!! is enough; none is not)', () => {
    const g = board([
      { card: W4.marco, don: 1 },
      { card: W4.kingdew, don: 3 },
      { card: W4.hajrudin },
      { card: W4.sai },
    ]);
    playRaw(g, MIHAWK);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.kingdew, W4.marco].sort());
  });

  it('rests the chosen Character and nobody else; its DON!! stay given', () => {
    const g = board([
      { card: W4.marco, don: 2 },
      { card: W4.kingdew, don: 1 },
    ]);
    playRaw(g, MIHAWK);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', W4.kingdew)).rested).toBe(false);
    expect(givenTo(g, chr(g, 'p2', W4.marco))).toBe(2);
    expect(donW(g, 'p2').given).toBe(3);
  });

  it('"up to 1": may rest nobody', () => {
    const g = board([{ card: W4.marco, don: 1 }]);
    playRaw(g, MIHAWK);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it("the opponent's Leader is not a candidate, with or without DON!!", () => {
    const g = mine(
      'ST01-001',
      { hand: [MIHAWK] },
      { leader: { card: W4.luffy, don: 2 }, characters: [{ card: W4.marco, don: 1 }] },
    );
    playRaw(g, MIHAWK);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.marco]);
  });

  it('with no Character holding a DON!! nothing is rested (an empty "up to" pick is simply ended)', () => {
    const g = board([W4.marco, W4.kingdew]);
    playRaw(g, MIHAWK);
    if (g.legal().some((a) => a.type === 'done')) {
      expect(offeredIds(g)).toEqual([]);
      g.act({ type: 'done' });
    }
    expect(atMain(g, 'p1')).toBe(true);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', W4.kingdew)).rested).toBe(false);
  });

  it('only DON!! GIVEN count: a Character whose owner has rested/active DON!! in the cost area is not a candidate', () => {
    const g = board([W4.marco], { costArea: { active: 2, rested: 2 } });
    playRaw(g, MIHAWK);
    if (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
  });

  it('the rested Character is active again after its owner refreshes', () => {
    const g = board([{ card: W4.marco, don: 1 }]);
    playRaw(g, MIHAWK);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(true);
    toMyNextMain(g);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
  });

  it('plays Mihawk normally: it stays on my field and the rest of my board is untouched', () => {
    const g = board([{ card: W4.marco, don: 1 }]);
    playRaw(g, MIHAWK);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([MIHAWK]);
    expect(g.card(chr(g, 'p1', MIHAWK)).rested).toBe(false);
  });
});
