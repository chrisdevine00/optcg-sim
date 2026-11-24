/**
 * OP14-093 Mr.4(Babe) (Character, Black, cost 4, 5000, Counter +1000, [Blocker], {Baroque Works}).
 *
 * Card text: "[Blocker]
 * [On K.O.] Add up to 1 Character card with a type including "Baroque Works" and a cost of 8 or less
 * from your trash to your hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-2-17 ([On K.O.] resolves from the trash, so Babe itself is a
 * card in the trash), CR 8-4-4 ("up to").
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  block,
  blockers,
  BW,
  chars,
  hand,
  kind,
  LD14,
  need,
  none,
  offeredIds,
  opponentKOs,
  passCounter,
  pickCards,
  reachablePickSets,
  SC14,
  theirs,
  theyKo,
  trash,
  TB,
} from './kit-op14d.ts';

const ID = BW.babe;

function koed(trashCards: string[], p2trash: string[] = []) {
  const g = theirs(
    LD14.bw,
    { characters: [{ card: ID, rested: true }], trash: trashCards },
    { trash: p2trash },
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe('OP14-093 Mr.4(Babe): [Blocker]; [On K.O.] add a Baroque Works Character (cost 8 or less) from the trash', () => {
  it('has [Blocker]; blocking an attack on my Leader gets it K.O.d (5000 vs 5000) and the [On K.O.] runs after the block', () => {
    const g = theirs(LD14.bw, { characters: [ID], trash: [BW.mr9] }, {});
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    block(g, at(g, 'p1', 'characters', ID));
    passCounter(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW.mr9, ID].sort());
    pickCards(g, [BW.mr9]);
    expect(hand(g)).toEqual([BW.mr9]);
    expect(g.life('p1')).toBe(4);
  });

  it('offers exactly the Baroque Works Characters of cost 8 or less: cost 8 is in, a plain Character is not', () => {
    const g = koed([BW.croc8, BW.mr9, BW.daz, SC14.c2, SC14.c9]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW.croc8, BW.mr9, BW.daz, ID].sort());
  });

  it('the K.O.d Babe is itself in the trash while the effect resolves, so it may return itself', () => {
    const g = koed([SC14.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID]);
    pickCards(g, [ID]);
    expect(hand(g)).toEqual([ID]);
    expect(trash(g)).toEqual([SC14.c2]);
  });

  it('the chosen card goes to my hand and leaves the trash; the others stay', () => {
    const g = koed([BW.mr9, BW.valentine]);
    pickCards(g, [BW.valentine]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([BW.valentine]);
    expect(trash(g)).toEqual([BW.mr9, ID].sort());
    expect(chars(g)).toEqual([]);
  });

  it('"up to 1": may add nothing; at most one is ever added', () => {
    const g = koed([BW.mr9, BW.valentine]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([BW.mr9, BW.valentine, ID].sort());
  });

  it('only Characters: a Baroque Works Event in the trash is not offered', () => {
    const g = koed(['OP14-099', 'OP14-098', TB.lola4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID]);
  });

  it("only my own trash: the opponent's Baroque Works Characters in their trash are not offered", () => {
    const g = koed([BW.mr9], [BW.valentine, BW.croc8]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW.mr9, ID].sort());
  });

  it("K.O.d by an opponent's effect: the same [On K.O.] resolves", () => {
    const g = theirs(LD14.bw, { characters: [ID], trash: [BW.mr9] }, { hand: ['OP09-077'] });
    opponentKOs(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickCards(g, [BW.mr9]);
    expect(hand(g)).toEqual([BW.mr9]);
    expect(kind(g)).toBe('main');
  });

  it('with only non-Baroque Works Characters in the trash nothing can be added', () => {
    const g = theirs(
      LD14.bw,
      { characters: [{ card: ID, rested: true }], trash: [SC14.c2, SC14.c4] },
      {},
    );
    theyKo(g, at(g, 'p1', 'characters', ID));
    // Babe itself is a candidate, so a choice is asked; the others are not offered.
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID]);
    none(g);
    expect(hand(g)).toEqual([]);
  });
});
