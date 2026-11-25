/**
 * OP10-032 Tashigi (Character, Green, cost 3, 4000, Counter +2000, {Navy}/{Punk Hazard}).
 *
 * Card text: "If you have a green Character other than [Tashigi] that would be removed from the field
 * by your opponent's effect, you may rest this Character instead."
 *
 * Rules: a replacement effect (CR 8-1-3-4): optional ("may"), applies to a removal by the
 * opponent's effect only (a K.O. in battle is not an effect; my own effects do not count); the
 * protected card must be a green Character that is not named [Tashigi]; resting is the substitute,
 * so an already-rested Tashigi cannot apply it (an impossible replacement cannot be used, RL-31);
 * the substituted removal does not happen, and Tashigi herself is not protected (official Q&A:
 * "the other Character is saved and the replacing Character is still K.O.'d").
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  cardIds,
  KINGDOM_COME,
  kind,
  need,
  no,
  noDefence,
  opponentKingdomCome,
  pickInst,
  playRaw,
  S14,
  theirs,
  V10,
  VAN,
  yes,
  type Chars,
} from './kit-op10a.ts';

const TASHIGI = 'OP10-032';
/** OP02-043 Roronoa Zoro: Green, cost 4, 6000, {FILM}/{Straw Hat Crew}/{Supernovas}. Vanilla. */
const ZORO = S14.zoroSn;
/** EB05-015 Tashigi: Green, cost 5, 7000, {Navy}/{East Blue}. Vanilla; named [Tashigi] too. */
const OTHER_TASHIGI = V10.tashigiNavy;
/** OP14-048 Shiryu: Blue, cost 8. [On Play] Return up to 1 of your opponent's Characters to the owner's hand. Then, trash all cards from your hand. */
const SHIRYU = 'OP14-048';

const LIFE4 = [VAN.marco, VAN.marco, VAN.marco, VAN.marco];

/** p2's turn with Kingdom Come in hand (K.O. by effect). My side: Tashigi plus `others`. */
function koBoard(others: Chars, tashigi: string | { card: string; rested: boolean } = TASHIGI) {
  return theirs(
    'ST01-001',
    { characters: [tashigi, ...(others ?? [])] },
    { hand: [KINGDOM_COME], life: LIFE4 },
  );
}

describe("OP10-032 Tashigi: a green Character other than [Tashigi] that would be removed by an opponent's effect: you may rest this instead", () => {
  it('printed values: cost 3, 4000, Counter +2000', () => {
    const g = theirs('ST01-001', { hand: [TASHIGI] });
    const c = g.find('p1', 'hand', TASHIGI);
    expect(g.card(c).cost).toBe(3);
    expect(g.card(c).counter).toBe(2000);
    expect(g.power(c)).toBe(4000);
  });

  it("a K.O. by the opponent's effect on a green Character is offered a replacement; accepting rests Tashigi and the Character stays", () => {
    const g = koBoard([ZORO]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', ZORO));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([TASHIGI, ZORO].sort());
    expect(g.card(at(g, 'p1', 'characters', TASHIGI)).rested).toBe(true);
    expect(cardIds(g, 'p1', 'trash')).toEqual([]);
  });

  it('"may": declining lets the removal happen and Tashigi stays active', () => {
    const g = koBoard([ZORO]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', ZORO));
    no(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([TASHIGI]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([ZORO]);
    expect(g.card(at(g, 'p1', 'characters', TASHIGI)).rested).toBe(false);
  });

  it("removal other than a K.O. also counts: an opponent's return-to-hand effect is replaced", () => {
    const g = theirs('ST01-001', { characters: [TASHIGI, ZORO] }, { hand: [SHIRYU] });
    playRaw(g, SHIRYU);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', ZORO)]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([TASHIGI, ZORO].sort());
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(g.card(at(g, 'p1', 'characters', TASHIGI)).rested).toBe(true);
  });

  it("only green Characters are protected: a red Character is K.O.'d with no offer", () => {
    const g = koBoard([VAN.marco]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', VAN.marco));
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([TASHIGI]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.marco]);
  });

  it('Tashigi herself is not protected: her own K.O. by an effect gets no offer', () => {
    const g = koBoard([ZORO]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', TASHIGI));
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([ZORO]);
  });

  it('a green Character named [Tashigi] (EB05-015) is not protected either', () => {
    const g = koBoard([OTHER_TASHIGI]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', OTHER_TASHIGI));
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([TASHIGI]);
  });

  it("a K.O. in battle is not an effect: no offer, the green Character is K.O.'d", () => {
    const g = theirs(
      'ST01-001',
      { characters: [TASHIGI, { card: ZORO, rested: true }] },
      { characters: [VAN.thatch] },
    );
    attack(g, at(g, 'p2', 'characters', VAN.thatch), at(g, 'p1', 'characters', ZORO));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([TASHIGI]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([ZORO]);
  });

  it("boundary: an already rested Tashigi cannot be rested again, so there is no offer and the Character is K.O.'d", () => {
    const g = koBoard([ZORO], { card: TASHIGI, rested: true });
    opponentKingdomCome(g, at(g, 'p1', 'characters', ZORO));
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([TASHIGI]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([ZORO]);
  });

  it('a rested green Character is protected too', () => {
    const g = koBoard([{ card: ZORO, rested: true }]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', ZORO));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([TASHIGI, ZORO].sort());
  });
});
