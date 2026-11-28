/**
 * OP18-088 Saint Sommers (Black Character, cost 6, 6000, Counter +2000, {Celestial Dragons}/{Holy Knights of God}).
 *
 * Card text: "[Your Turn] [On Play] If you have 6 or more DON!! cards on your field, K.O. up to 1 of
 *             your opponent's Characters with a base cost of 4 or less.
 *             [On K.O.] You may trash 2 cards from your hand: Play this Character card from your trash."
 *
 * Readings: "DON!! cards on your field" counts active, rested and given DON!! (the DON!! rested to
 * pay Sommers' cost still count). "Base cost" is the printed cost (an opposing Giant is base 3 and
 * so a legal target although its current cost is 15). [Your Turn] means the [On Play] only works on
 * its owner's turn, so the Sommers played back during the opponent's turn K.O.s nothing.
 * Scenery: OP01-012 Sai (2), OP01-018 Hajrudin (4), OP02-006 Kingdew (5), OP18-086 Goldberg (base
 * 3, +12), OP12-005 Shiki (cost 8, 10000, the attacker), OP18-097 Abyss Pentagram (reduces Sommers'
 * cost by 1 under the {Celestial Dragons} Leader OP18-060 so that 5 DON!! suffice).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  cardIds,
  decline,
  donOf,
  mayChooseNone,
  need,
  none,
  offeredIds,
  passBlock,
  payHand,
  pickCards,
  play,
  unusable,
  yes,
  LDR,
  CH,
} from './kit-e.ts';
import { LE, mineE, theirsE, X } from './kit-e.ts';

const S = X.sommers;
const SAI = 'OP01-012';
const C4 = 'OP01-018';
const C5 = CH.kingdew5;
const GOLD = X.goldberg;
const SHIKI = 'OP12-005';
const MISS = 'OP02-060';

function play6(active: number, p2: object = {}, p1: object = {}, leader: string = LDR.luffy) {
  const g = mineE(leader, { hand: [S], costArea: { active, rested: 0 }, ...p1 }, p2);
  play(g, at(g, 'p1', 'hand', S));
  return g;
}

describe('OP18-088 Saint Sommers: [Your Turn] [On Play] with 6+ DON!! on your field, K.O. up to 1 opposing Character with base cost 4 or less', () => {
  const p2 = { characters: [SAI, C4, C5, GOLD] };

  it('with 10 DON!!: offers opposing Characters of base cost <= 4 (4 in, 5 out) and K.O.s the pick', () => {
    const g = play6(10, p2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAI, C4, GOLD].sort());
    pickCards(g, [C4]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([C4]);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('"base cost": an opposing Giant (printed 3, current 15) is a legal target', () => {
    const g = play6(10, p2);
    pickCards(g, [GOLD]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([GOLD]);
  });

  it('boundary: exactly 6 DON!! (all rested to pay Sommers) still counts as 6 on the field', () => {
    const g = play6(6, p2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 6 });
    need(g, 'choose', 'p1');
    pickCards(g, [SAI]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SAI]);
  });

  it('boundary: only 5 DON!! on the field (Pentagram makes the cost 5) -> no K.O.', () => {
    const g = mineE(
      LE.cd,
      { hand: [S], stage: 'OP18-097', costArea: { active: 5, rested: 0 } },
      p2,
    );
    play(g, at(g, 'p1', 'hand', S));
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    expect(atMain(g, 'p1')).toBe(true);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('DON!! given to a Leader or Character also count: 5 rested + 1 given = 6', () => {
    const g = mineE(
      { card: LE.cd, don: 1 },
      { hand: [S], stage: 'OP18-097', costArea: { active: 5, rested: 0 } },
      p2,
    );
    play(g, at(g, 'p1', 'hand', S));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAI, C4, GOLD].sort());
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = play6(10, p2);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(4);
  });

  it('only opposing Characters: my own cheap Character is not offered', () => {
    const g = play6(10, { characters: [SAI] }, { characters: [MISS] });
    expect(offeredIds(g)).toEqual([SAI]);
  });
});

describe('OP18-088 Saint Sommers: [On K.O.] you may trash 2 cards from your hand: play this Character from your trash', () => {
  function falls(hand: string[], p2: object = {}) {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: S, rested: true }], hand },
      { characters: [SHIKI], ...p2 },
    );
    attack(g, at(g, 'p2', 'characters', SHIKI), at(g, 'p1', 'characters', S));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('paying 2 hand cards returns Sommers from the trash to the field, active', () => {
    const g = falls([CH.marco3, CH.thatch6, MISS]);
    yes(g, 'p1');
    payHand(g, [CH.marco3, CH.thatch6]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([S]);
    expect(g.card(at(g, 'p1', 'characters', S)).rested).toBe(false);
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([CH.marco3, CH.thatch6].sort());
    expect(cardIds(g, 'p1', 'hand')).toEqual([MISS]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('declining leaves Sommers in the trash and the hand intact', () => {
    const g = falls([CH.marco3, CH.thatch6]);
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([S]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
  });

  it('exactly 2 cards in hand is enough', () => {
    const g = falls([CH.marco3, CH.thatch6]);
    yes(g, 'p1');
    payHand(g, [CH.marco3, CH.thatch6]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([S]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('only 1 card in hand: the cost cannot be paid and Sommers stays in the trash', () => {
    const g = falls([CH.marco3]);
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'trash')).toEqual([S]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Your Turn]: played back during the opponent’s turn, its [On Play] K.O. does not fire', () => {
    const g = falls([CH.marco3, CH.thatch6], { characters: [SHIKI, SAI] });
    yes(g, 'p1');
    payHand(g, [CH.marco3, CH.thatch6]);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([SAI, SHIKI].sort());
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('does not fire when Sommers survives (a 5000 attacker cannot K.O. 6000)', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: S, rested: true }], hand: [CH.marco3, CH.thatch6] },
      { characters: [CH.marco3] },
    );
    attack(g, at(g, 'p2', 'characters', CH.marco3), at(g, 'p1', 'characters', S));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([S]);
  });
});
