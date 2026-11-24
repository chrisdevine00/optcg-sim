/**
 * OP16-007 Jozu (Character, Red, cost 7, 8000, no Counter, {Whitebeard Pirates}, Strike, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may reveal 1 Character card with 8000 power from your hand: Give
 * up to 1 of your opponent's Characters -1000 power during this turn."
 *
 * Rules: CR 10-1-3 ([Blocker]), CR 8-3-1 (costs), "during this turn" ends at CR 6-6-1-3 (RL-09),
 * "up to 1" (CR 8-4-4-1).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  choices,
  describeEightKCost,
  endTurn,
  hand,
  kw,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  OL,
  OV,
  payHand,
  pickInst,
  playCard,
  pw,
  yes,
  fill,
  RED,
} from './kit-op16a.ts';

const JOZU = 'OP16-007';

function playIt(extra: string[], p2chars: string[] = [OV.hajrudin6]) {
  const g = mine(
    OL.luffy,
    { hand: [JOZU, ...extra], deck: fill(RED, 10) },
    { characters: p2chars },
  );
  playCard(g, JOZU);
  return g;
}
function pay(extra: string[] = [OV.thatch], p2chars: string[] = [OV.hajrudin6]) {
  const g = playIt(extra, p2chars);
  yes(g);
  payHand(g, [extra[0]!]);
  return g;
}

describeEightKCost({
  id: JOZU,
  verb: 'reveal',
  start: (extra) => playIt(extra),
  afterPay: (g) => pickInst(g, [at(g, 'p2', 'characters', OV.hajrudin6)]),
  happened: (g) => pw(g, 'p2', OV.hajrudin6) === 5000,
});

describe('OP16-007 Jozu: [Blocker] and [On Play] -1000 power', () => {
  it('has [Blocker]', () => {
    const g = mine(OL.luffy, { characters: [JOZU] });
    expect(kw(g, at(g, 'p1', 'characters', JOZU))).toContain('Blocker');
  });

  it('gives exactly -1000 power to the chosen opposing Character', () => {
    const g = pay();
    need(g, 'choose');
    pickInst(g, [at(g, 'p2', 'characters', OV.hajrudin6)]);
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(5000);
  });

  it("the choice is among the opponent's Characters only", () => {
    const g = mine(
      OL.luffy,
      { hand: [JOZU, OV.thatch], characters: [OV.sai4] },
      { characters: [OV.hajrudin6] },
    );
    playCard(g, JOZU);
    yes(g);
    payHand(g, [OV.thatch]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.hajrudin6]);
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": may choose nothing; the revealed card still stays in hand', () => {
    const g = pay();
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(6000);
    expect(hand(g)).toEqual([OV.thatch]);
  });

  it('only one of two opposing Characters is reduced', () => {
    const g = pay([OV.thatch], [OV.hajrudin6, OV.kingdew5]);
    pickInst(g, [at(g, 'p2', 'characters', OV.kingdew5)]);
    expect(pw(g, 'p2', OV.kingdew5)).toBe(6000);
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(6000);
  });

  it('can bring a 0-power-class Character below zero without removing it (power may be negative)', () => {
    const g = pay([OV.thatch], [OV.cobra0]);
    pickInst(g, [at(g, 'p2', 'characters', OV.cobra0)]);
    expect(pw(g, 'p2', OV.cobra0)).toBe(-1000);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('"during this turn": the reduction ends with the turn', () => {
    const g = pay();
    pickInst(g, [at(g, 'p2', 'characters', OV.hajrudin6)]);
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(5000);
    endTurn(g);
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(6000);
  });

  it('declining the cost changes no power', () => {
    const g = playIt([OV.thatch]);
    need(g, 'optional');
    expect(pw(g, 'p2', OV.hajrudin6)).toBe(6000);
  });
});
