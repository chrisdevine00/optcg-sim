/**
 * OP16-009 Speed Jil (Character, Red, cost 4, 5000, Counter +1000, {Whitebeard Pirates}, Slash).
 *
 * Card text: "[On Play] You may trash 1 Character card with 8000 power from your hand: This Character
 * gains [Rush] and +2000 power until the end of your opponent's next End Phase."
 *
 * Rules: CR 10-1-1 ([Rush]), CR 3-7-4 (summoning sickness), duration "until the end of your
 * opponent's next End Phase" = CR 6-6-1-2 of the opponent's turn (RL-11).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  canHit,
  charIds,
  describeEightKCost,
  endTurn,
  kw,
  mine,
  need,
  OL,
  OV,
  payHand,
  playCard,
  pw,
  yes,
  hand,
  trash,
} from './kit-op16a.ts';

const JIL = 'OP16-009';

function playIt(extra: string[]) {
  const g = mine(
    OL.luffy,
    { hand: [JIL, ...extra] },
    { characters: [{ card: OV.hajrudin6, rested: true }] },
  );
  playCard(g, JIL);
  return g;
}
const jil = (g: ReturnType<typeof playIt>) => at(g, 'p1', 'characters', JIL);
function pay(extra: string[] = [OV.thatch]) {
  const g = playIt(extra);
  yes(g);
  payHand(g, [OV.thatch]);
  return g;
}

describeEightKCost({
  id: JIL,
  verb: 'trash',
  start: playIt,
  happened: (g) => kw(g, jil(g)).includes('Rush'),
});

describe('OP16-009 Speed Jil: [On Play] gains [Rush] and +2000', () => {
  it('without paying it is a 5000 Character with no [Rush] that cannot attack this turn', () => {
    const g = playIt([OV.thatch]);
    need(g, 'optional');
    act(g, { type: 'optional', accept: false });
    expect(pw(g, 'p1', JIL)).toBe(5000);
    expect(kw(g, jil(g))).not.toContain('Rush');
    expect(canHit(g, jil(g), g.leader('p2'))).toBe(false);
  });

  it('paying gives +2000 power (7000) and [Rush] at once', () => {
    const g = pay();
    expect(pw(g, 'p1', JIL)).toBe(7000);
    expect(kw(g, jil(g))).toContain('Rush');
  });

  it('with [Rush] it may attack the opposing Leader and the rested Character the turn it is played', () => {
    const g = pay();
    expect(canHit(g, jil(g), g.leader('p2'))).toBe(true);
    expect(canHit(g, jil(g), at(g, 'p2', 'characters', OV.hajrudin6))).toBe(true);
  });

  it('the 8000-power card is trashed from hand; other hand cards stay', () => {
    const g = pay([OV.thatch, OV.sai4]);
    expect(trash(g)).toEqual([OV.thatch]);
    expect(hand(g)).toEqual([OV.sai4]);
  });

  it("the bonus lasts through the opponent's turn: still 7000 with [Rush] in their Main Phase", () => {
    const g = pay();
    endTurn(g);
    expect(pw(g, 'p1', JIL)).toBe(7000);
    expect(kw(g, jil(g))).toContain('Rush');
  });

  it("it ends at the end of the opponent's next End Phase: back to 5000 without [Rush] on my next turn", () => {
    const g = pay();
    endTurn(g);
    endTurn(g);
    expect(pw(g, 'p1', JIL)).toBe(5000);
    expect(kw(g, jil(g))).not.toContain('Rush');
  });

  it('only this Character gains it, not my other Characters', () => {
    const g = mine(OL.luffy, { hand: [JIL, OV.thatch], characters: [OV.sai4] });
    playCard(g, JIL);
    yes(g);
    payHand(g, [OV.thatch]);
    expect(pw(g, 'p1', OV.sai4)).toBe(4000);
    expect(kw(g, at(g, 'p1', 'characters', OV.sai4))).not.toContain('Rush');
    expect(charIds(g, 'p1')).toEqual([OV.sai4, JIL].sort());
  });
});
