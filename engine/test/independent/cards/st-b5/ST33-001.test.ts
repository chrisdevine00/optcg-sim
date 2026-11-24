/**
 * ST33-001 Koby (Blue Character, cost 2, 1000, Counter +1000, Strike, {Navy}, printed [Blocker]).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new
 * target of the attack.)
 * [On Play] You may trash 1 card from your hand: Draw 1 card."
 *
 * Rules: CR 10-1-4 ([Blocker]; only an active Character can rest to block), RD 120 (an unpayable
 * cost cannot be paid at all), draw after the cost.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  blockers,
  BLUE,
  deck,
  fill,
  hand,
  kw,
  LDB,
  mayPayHand,
  mine,
  need,
  no,
  offeredIds,
  passBlock,
  playRaw,
  SB,
  T,
  theirs,
  trash,
  unusable,
  yes,
  cardIds,
} from './kit-stb5b.ts';

const KOBY = T.koby;

function setup(handExtra: string[] = [SB.c1p3]) {
  return mine(LDB.strike, { hand: [KOBY, ...handExtra], deck: [SB.c3p5, ...fill(BLUE, 14)] });
}

describe('ST33-001 Koby: [Blocker]; [On Play] may trash 1 card from hand: draw 1', () => {
  it('trash 1 card: the top card of the deck is drawn', () => {
    const g = setup();
    playRaw(g, KOBY);
    mayPayHand(g, [SB.c1p3]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SB.c1p3]);
    expect(hand(g)).toEqual([SB.c3p5]);
    expect(deck(g)).toHaveLength(14);
  });

  it('the card trashed is the player choice among the hand', () => {
    const g = setup([SB.c1p3, SB.c4p6]);
    playRaw(g, KOBY);
    yes(g);
    expect(offeredIds(g)).toEqual([SB.c1p3, SB.c4p6].sort());
  });

  it('the trash comes first: the drawn card cannot pay the cost', () => {
    const g = setup([SB.c1p3]);
    playRaw(g, KOBY);
    yes(g);
    expect(offeredIds(g)).not.toContain(SB.c3p5);
  });

  it('declining the "you may": nothing is trashed or drawn', () => {
    const g = setup();
    playRaw(g, KOBY);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SB.c1p3]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('RD 120: with an empty hand the cost cannot be paid and nothing is drawn', () => {
    const g = setup([]);
    playRaw(g, KOBY);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('exactly one card is drawn', () => {
    const g = setup([SB.c1p3, SB.c4p6]);
    playRaw(g, KOBY);
    mayPayHand(g, [SB.c4p6]);
    expect(hand(g)).toEqual([SB.c1p3, SB.c3p5].sort());
    expect(deck(g)).toHaveLength(14);
  });

  it('printed [Blocker]: the keyword is on the card', () => {
    const g = setup();
    const k = playRaw(g, KOBY);
    no(g);
    expect(kw(g, k)).toContain('Blocker');
  });

  it('[Blocker]: an active Koby can block an attack on the Leader and takes the hit', () => {
    const g = theirs(LDB.strike, { characters: [KOBY] });
    const koby = g.find('p1', 'characters', KOBY);
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([koby]);
    act(g, { type: 'block', blocker: koby });
    expect(g.card(koby).rested).toBe(true);
    // Leader power 5000 against Koby 1000: Koby is K.O.ed, no Life card is taken.
    act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(g.life('p1')).toBe(4);
  });

  it('[Blocker]: a rested Koby cannot block', () => {
    const g = theirs(LDB.strike, { characters: [{ card: KOBY, rested: true }] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
  });
});
