/**
 * PRB02-001 Koby (Character, Red, cost 4, 5000, Counter +1000, {Navy}/{SWORD}).
 *
 * Card text: "[Opponent's Turn] If your Leader has the "Navy" type, this Character gains +1000 power.
 * [When Attacking] K.O. up to 1 of your opponent's Characters with 3000 base power or less. Then,
 * if you have 6 or less cards in your hand, draw 1 card."
 *
 * Rules: [Opponent's Turn] works only during the opponent's turn. "Base power" ignores every
 * modifier (rules-digest, base power). "Up to 1" may be answered with nothing (CR 8-4-4-1). "Then"
 * is a sequence, not a condition on the first part (CR 4-10-2): the draw check does not depend on
 * whether anything was K.O.d. The hand size is counted when the draw is resolved.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chr,
  gammaKnife,
  hand,
  kind,
  LDP,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  pickInst,
  SP,
  sorted,
  theirs,
} from './kit-prb02sta.ts';

const KO = 'PRB02-001';
const six = (card: string) => Array.from({ length: 6 }, () => card);

function swing(
  hnd: string[],
  p2chars: (string | { card: string; rested?: boolean })[],
  leader: string = LDP.navy,
) {
  const g = mine(leader, { hand: hnd, characters: [KO] }, { characters: p2chars });
  attack(g, at(g, 'p1', 'characters', KO), g.leader('p2'));
  return g;
}

describe("PRB02-001 Koby: [Opponent's Turn] Navy +1000; [When Attacking] K.O. base power 3000 or less, then draw if hand <= 6", () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = mine(LDP.navy, { characters: [KO] });
    const c = g.card(at(g, 'p1', 'characters', KO));
    expect([c.cost, c.power, c.counter]).toEqual([4, 5000, 1000]);
  });

  it("[Opponent's Turn] with a {Navy} Leader: 6000 power during the opponent's turn", () => {
    const g = theirs(LDP.navy, { characters: [KO] });
    expect(g.power(at(g, 'p1', 'characters', KO))).toBe(6000);
  });

  it("[Opponent's Turn] without a {Navy} Leader: stays 5000 on their turn", () => {
    const g = theirs(LDP.neutral, { characters: [KO] });
    expect(g.power(at(g, 'p1', 'characters', KO))).toBe(5000);
  });

  it("[Opponent's Turn] gives nothing on my own turn, even with a {Navy} Leader", () => {
    const g = mine(LDP.navy, { characters: [KO] });
    expect(g.power(at(g, 'p1', 'characters', KO))).toBe(5000);
  });

  it('[When Attacking] offers exactly the Characters with 3000 base power or less (3000 and 2000, not 4000)', () => {
    const g = swing([], [SP.c1p3, SP.c1p2, SP.c2p4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c1p2, SP.c1p3].sort());
  });

  it('K.O.s the chosen Character, then the attack goes on to the Block Step', () => {
    const g = swing([], [SP.c1p3, SP.c1p2]);
    pickInst(g, [chr(g, 'p2', SP.c1p3)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p2]);
    expect(sorted(g, 'p2', 'trash')).toEqual([SP.c1p3]);
    expect(kind(g)).toBe('block');
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('K.O.s only one Character even when two qualify', () => {
    const g = swing([], [SP.c1p3, SP.c1p2]);
    pickInst(g, [chr(g, 'p2', SP.c1p2)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p3]);
  });

  it('hand of 6: draws 1 after the K.O. (7 cards)', () => {
    const g = swing(six(SP.mohji), [SP.c1p3]);
    pickInst(g, [chr(g, 'p2', SP.c1p3)]);
    expect(hand(g)).toHaveLength(7);
  });

  it('hand of 7: no draw (boundary: 6 or less)', () => {
    const g = swing([...six(SP.mohji), SP.mohji], [SP.c1p3]);
    pickInst(g, [chr(g, 'p2', SP.c1p3)]);
    expect(hand(g)).toHaveLength(7);
    expect(sorted(g, 'p2', 'characters')).toEqual([]);
  });

  it('empty hand: draws 1', () => {
    const g = swing([], [SP.c1p3]);
    pickInst(g, [chr(g, 'p2', SP.c1p3)]);
    expect(hand(g)).toHaveLength(1);
  });

  it('"up to 1": choosing nothing K.O.s nothing (the sequence still reaches the draw check)', () => {
    const g = swing([], [SP.c1p3]);
    need(g, 'choose', 'p1');
    none(g);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p3]);
    expect(hand(g)).toHaveLength(1);
    expect(kind(g)).toBe('block');
  });

  it('with no Character of 3000 base power or less the K.O. finds nothing and the draw still resolves', () => {
    const g = swing([], [SP.c2p4, SP.c3p5]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toHaveLength(1);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c2p4, SP.c3p5].sort());
  });

  it('"base power": a 5000-base Character lowered to 0 this turn is NOT offered', () => {
    const g = mine(
      LDP.navy,
      { hand: [SP.gammaKnife], characters: [KO] },
      { characters: [SP.c3p5, SP.c1p3] },
    );
    gammaKnife(g, chr(g, 'p2', SP.c3p5));
    expect(g.power(chr(g, 'p2', SP.c3p5))).toBe(0);
    attack(g, at(g, 'p1', 'characters', KO), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c1p3]);
  });

  it('attacking a rested Character triggers [When Attacking] as well', () => {
    const g = mine(
      LDP.navy,
      { characters: [KO] },
      { characters: [{ card: SP.c4p6, rested: true }, SP.c1p3] },
    );
    attack(g, at(g, 'p1', 'characters', KO), chr(g, 'p2', SP.c4p6));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c1p3]);
    pickInst(g, [chr(g, 'p2', SP.c1p3)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c4p6]);
  });

  it('nothing happens when the Koby is not attacking: no K.O. and no draw in the Main Phase', () => {
    const g = mine(LDP.navy, { characters: [KO] }, { characters: [SP.c1p3] });
    expect(kind(g)).toBe('main');
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p3]);
    expect(hand(g)).toEqual([]);
  });
});
