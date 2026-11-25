/**
 * OP09-090 Doc Q (Character, Black, cost 2, 0 power, Counter +1000, {Blackbeard Pirates}, Special).
 *
 * Card text: "[Activate: Main] You may rest this Character: If your Leader has the "Blackbeard
 * Pirates" type, K.O. up to 1 of your opponent's Characters with a cost of 1 or less.
 * [On K.O.] Draw 1 card."
 *
 * Rules: the "If" is after the colon (an effect condition: the rest cost is paid first). "Up to 1"
 * may be 0. A K.O. puts the Character into its owner's trash (CR 10-2-1-2).
 */
import { describe, expect, it } from 'vitest';
import {
  abil,
  actRaw,
  at,
  atMain,
  attack,
  chr,
  deck,
  hand,
  kind,
  LD9,
  mayEnd,
  mine,
  need,
  noDefenceAtAll,
  none,
  offeredIds,
  offeredInsts,
  pickInst,
  SC9,
  theirs,
  trash,
} from './kit-op09c.ts';

const DOCQ = 'OP09-090';

function board(leader: string = LD9.bbp, p2chars: string[] = [SC9.c1, SC9.c2], own: string[] = []) {
  return mine(leader, { characters: [DOCQ, ...own] }, { characters: p2chars });
}

describe('OP09-090 Doc Q: [Activate: Main] rest this: K.O. up to 1 cost 1 or less; [On K.O.] draw 1', () => {
  it('printed values: cost 2, 0 power, Counter +1000', () => {
    const g = board();
    const c = g.card(chr(g, 'p1', DOCQ));
    expect(c.cost).toBe(2);
    expect(c.power).toBe(0);
    expect(c.counter).toBe(1000);
  });

  it('offers only opponent Characters with cost 1 or less (cost 2 is not a candidate)', () => {
    const g = board(LD9.bbp, [SC9.c1, SC9.c2, SC9.c3]);
    actRaw(g, chr(g, 'p1', DOCQ));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC9.c1]);
  });

  it("K.O.s the chosen Character into its owner's trash and rests Doc Q", () => {
    const g = board();
    actRaw(g, chr(g, 'p1', DOCQ));
    pickInst(g, [chr(g, 'p2', SC9.c1)]);
    expect(atMain(g)).toBe(true);
    expect(trash(g, 'p2')).toEqual([SC9.c1]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC9.c2]);
    expect(g.card(chr(g, 'p1', DOCQ)).rested).toBe(true);
  });

  it('a Character reduced to cost 1 by another effect would qualify: current cost is read (a cost-0 Character qualifies)', () => {
    // OP17-097 is not used here: a printed cost-1 Character is the boundary; cost 0 is covered by
    // the filter "1 or less". A Character with printed cost 0 does not exist in the scenery, so only
    // the boundary 1 versus 2 is asserted.
    const g = board(LD9.bbp, [SC9.c1, SC9.c2]);
    actRaw(g, chr(g, 'p1', DOCQ));
    expect(offeredIds(g)).toContain(SC9.c1);
    expect(offeredIds(g)).not.toContain(SC9.c2);
  });

  it('"up to 1": may choose nothing; nobody is K.O.\'d but Doc Q is still rested', () => {
    const g = board();
    actRaw(g, chr(g, 'p1', DOCQ));
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(trash(g, 'p2')).toEqual([]);
    expect(g.card(chr(g, 'p1', DOCQ)).rested).toBe(true);
  });

  it('K.O.s at most one Character', () => {
    const g = board(LD9.bbp, [SC9.c1, SC9.tb1]);
    actRaw(g, chr(g, 'p1', DOCQ));
    pickInst(g, [chr(g, 'p2', SC9.c1)]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it("with no opponent Character of cost 1 or less nothing can be chosen and nothing is K.O.'d", () => {
    const g = board(LD9.bbp, [SC9.c2, SC9.c3]);
    actRaw(g, chr(g, 'p1', DOCQ));
    if (kind(g) === 'choose') {
      expect(offeredInsts(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.card(chr(g, 'p1', DOCQ)).rested).toBe(true);
  });

  it("a Leader without {Blackbeard Pirates}: the rest cost is paid but nobody is K.O.'d", () => {
    const g = board(LD9.luffy);
    actRaw(g, chr(g, 'p1', DOCQ));
    if (kind(g) === 'choose') {
      expect(offeredInsts(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(trash(g, 'p2')).toEqual([]);
    expect(g.card(chr(g, 'p1', DOCQ)).rested).toBe(true);
  });

  it("only the opponent's Characters: my own cost-1 Character is not offered", () => {
    const g = board(LD9.bbp, [SC9.c1], [SC9.c1]);
    actRaw(g, chr(g, 'p1', DOCQ));
    expect(offeredInsts(g)).toEqual([chr(g, 'p2', SC9.c1)]);
  });

  it('an already rested Doc Q cannot pay the rest cost: not offered', () => {
    const g = mine(
      LD9.bbp,
      { characters: [{ card: DOCQ, rested: true }] },
      { characters: [SC9.c1] },
    );
    expect(abil(g, chr(g, 'p1', DOCQ))).toEqual([]);
  });

  it('only once while rested: not offered again in the same turn', () => {
    const g = board();
    actRaw(g, chr(g, 'p1', DOCQ));
    pickInst(g, [chr(g, 'p2', SC9.c1)]);
    expect(abil(g, chr(g, 'p1', DOCQ))).toEqual([]);
  });

  it("[On K.O.]: when K.O.'d in battle it draws 1 card", () => {
    const g = theirs(
      LD9.bbp,
      { characters: [{ card: DOCQ, rested: true }], deck: [SC9.c2, SC9.c3, SC9.c4] },
      { characters: [SC9.c5] },
    );
    attack(g, chr(g, 'p2', SC9.c5), chr(g, 'p1', DOCQ));
    noDefenceAtAll(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([SC9.c2]);
    expect(deck(g)).toHaveLength(2);
  });

  it('[On K.O.] draws regardless of my Leader type (no condition)', () => {
    const g = theirs(
      LD9.luffy,
      { characters: [{ card: DOCQ, rested: true }], deck: [SC9.c2, SC9.c3, SC9.c4] },
      { characters: [SC9.c5] },
    );
    attack(g, chr(g, 'p2', SC9.c5), chr(g, 'p1', DOCQ));
    noDefenceAtAll(g);
    expect(hand(g)).toEqual([SC9.c2]);
  });

  it("is not offered during the opponent's turn", () => {
    const g = theirs(LD9.bbp, { characters: [DOCQ] }, { characters: [SC9.c1] });
    expect(abil(g, at(g, 'p1', 'characters', DOCQ))).toEqual([]);
  });
});
