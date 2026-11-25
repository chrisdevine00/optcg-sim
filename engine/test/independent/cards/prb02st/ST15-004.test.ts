/**
 * ST15-004 Thatch (Character, cost 1, 2000, Counter +2000, {Whitebeard Pirates}).
 *
 * Card text: "[On Play] If your Leader's type includes "Whitebeard Pirates", give up to 1 of your
 * opponent's Characters -2000 power during this turn. Then, add 1 card from the top of your Life
 * cards to your hand."
 *
 * Rules: "If" gates the whole effect, "Then" does not resolve after a failed "If" (M4b-5). "Up to
 * 1" may be answered with nothing. A card added from Life to hand is not damage: its [Trigger] is
 * not activated (CR 10-1-5 only applies to damage). "During this turn" ends at the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  atMainOf,
  chr,
  hand,
  LDP,
  lifeCards,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SP,
  sorted,
  toMyNextMain,
  kind,
} from './kit-prb02sta.ts';

const TH = 'ST15-004';
/** OP01-104 Speed: Purple Character, cost 2, "[Trigger] Play this card." */
const SPEED = 'OP01-104';

function play(
  leader: string,
  p2chars: string[] = [SP.c3p5],
  life?: string[],
  hnd: string[] = [TH],
) {
  const g = mine(leader, { hand: hnd, ...(life ? { life } : {}) }, { characters: p2chars });
  playRaw(g, TH);
  return g;
}

describe('ST15-004 Thatch: [On Play] if Leader is {Whitebeard Pirates}: -2000 power, then add 1 Life to hand', () => {
  it('printed values: cost 1, 2000 power, Counter +2000', () => {
    const g = mine(LDP.wb, { characters: [TH] });
    const c = g.card(g.find('p1', 'characters', TH));
    expect([c.cost, c.power, c.counter]).toEqual([1, 2000, 2000]);
  });

  it('with a {Whitebeard Pirates} Leader: the chosen opposing Character gets -2000 and the top Life card goes to hand', () => {
    const g = play(LDP.wb, [SP.c3p5], [SP.c1p3, SP.c2p4, SP.c4p6, SP.c5p7]);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SP.c3p5)]);
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(3000);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([SP.c1p3]);
    expect(atMainOf(g)).toBe(true);
  });

  it('the card taken is the TOP Life card, the rest stay in order', () => {
    const g = play(LDP.wb, [SP.c3p5], [SP.c1p3, SP.c2p4, SP.c4p6, SP.c5p7]);
    pickInst(g, [chr(g, 'p2', SP.c3p5)]);
    expect(lifeCards(g)).toEqual([SP.c2p4, SP.c4p6, SP.c5p7]);
  });

  it("only the opponent's Characters are offered (not their Leader, not my own Characters)", () => {
    const g = mine(
      LDP.wb,
      { hand: [TH], characters: [SP.c1p3] },
      { characters: [SP.c3p5, SP.c4p6] },
    );
    playRaw(g, TH);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c3p5, SP.c4p6].sort());
  });

  it('a Leader with another {Whitebeard Pirates} (Edward.Newgate, {The Four Emperors}/{Whitebeard Pirates}) also qualifies', () => {
    const g = play('OP02-001');
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SP.c3p5)]);
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(3000);
  });

  it('without a {Whitebeard Pirates} Leader: no -2000, no Life added (the "Then" does not resolve) and nothing is asked', () => {
    const g = play(LDP.neutral, [SP.c3p5], [SPEED, SP.c1p3, SP.c1p3, SP.c1p3]);
    expect(kind(g)).toBe('main');
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(5000);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": choosing no target applies no -2000 (the Character stays at 5000)', () => {
    const g = play(LDP.wb);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(5000);
  });

  it('with no opposing Character the effect still asks an empty "up to 1" or ends, and Life is still added', () => {
    const g = play(LDP.wb, [], [SP.c1p3, SP.c2p4, SP.c4p6, SP.c5p7]);
    if (kind(g) === 'choose') none(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([SP.c1p3]);
  });

  it('with no Life cards the -2000 still applies and nothing is added to hand', () => {
    const g = play(LDP.wb, [SP.c3p5], []);
    pickInst(g, [chr(g, 'p2', SP.c3p5)]);
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(3000);
    expect(g.life('p1')).toBe(0);
    expect(hand(g)).toEqual([]);
  });

  it('the Life card added to hand does not activate its [Trigger]: Speed stays in hand, nothing is played', () => {
    const g = play(LDP.wb, [SP.c3p5], [SPEED, SP.c1p3, SP.c1p3, SP.c1p3]);
    pickInst(g, [chr(g, 'p2', SP.c3p5)]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SPEED]);
    expect(sorted(g, 'p1', 'characters')).toEqual([TH]);
  });

  it('-2000 lasts this turn only: the Character is back to 5000 on my next turn', () => {
    const g = play(LDP.wb);
    pickInst(g, [chr(g, 'p2', SP.c3p5)]);
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(3000);
    toMyNextMain(g);
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(5000);
  });

  it('a 2000-power Character goes to 0 and stays on the field (power loss is not a K.O.)', () => {
    const g = play(LDP.wb, [SP.c1p2]);
    pickInst(g, [chr(g, 'p2', SP.c1p2)]);
    expect(g.power(chr(g, 'p2', SP.c1p2))).toBe(0);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p2]);
  });
});
