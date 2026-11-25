/**
 * OP12-027 Koushirou (Character, Green, cost 2, 1000, Counter +1000, Slash, {East Blue}/{Frost
 * Moon Village}).
 *
 * Card text: "If your <Slash> attribute Character with a cost of 5 or less other than this Character
 * would be K.O.'d by your opponent's effect, you may rest this Character instead. [Blocker]"
 *
 * Rules: a replacement effect (CR 8-1-3-4): optional ("may", RL-31); it covers a K.O. by the
 * opponent's effect only (not battle); the protected card is another <Slash> Character of cost 5
 * or less; resting is the substitute, so an already rested Koushirou cannot apply it (an
 * impossible replacement, CR 8-1-3-4-5); official Q&A (QA-OP12 OP12-027): two copies can each
 * apply, each protecting the other.
 * Scenery: OP01-012 Sai (Slash, 2), OP01-053 Wire (Slash, 2), EB05-015 Tashigi (Slash, 5), OP04-023
 * Kuro (Slash, 6), OP01-023 Marco (Special, 3); EB01-059 Kingdom Come K.O.s.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  isRested,
  KINGDOM_COME,
  kind,
  LD_LF,
  need,
  no,
  noDefence,
  opponentKingdomCome,
  theirs,
  trash,
  VAN_LF,
  yes,
} from './kit-lfa.ts';

const KOU = 'OP12-027';
const { sai, wire, tashigi5, kuro6, marco, thatch, mohji } = VAN_LF;
type Ch = string | { card: string; rested?: boolean };

/** p2's turn with Kingdom Come; p1 has `mine`. */
function board(mineChars: Ch[], p2chars: Ch[] = [thatch]) {
  return theirs(
    LD_LF.luffy,
    { characters: mineChars },
    { hand: [KINGDOM_COME], characters: p2chars, life: [mohji, mohji, mohji, mohji] },
  );
}

describe('OP12-027 Koushirou', () => {
  it('printed values: cost 2, 1000 power, Counter +1000, [Blocker]', () => {
    const g = board([KOU]);
    const k = at(g, 'p1', 'characters', KOU);
    expect(g.card(k).cost).toBe(2);
    expect(g.power(k)).toBe(1000);
    expect(g.card(k).counter).toBe(1000);
    expect(g.card(k).keywords).toContain('Blocker');
  });

  it("a <Slash> Character of cost 5 or less would be K.O.'d by an effect: accepting rests Koushirou and the Character stays", () => {
    const g = board([KOU, sai]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', sai));
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    yes(g, 'p1');
    expect(chars(g)).toEqual([KOU, sai].sort());
    expect(isRested(g, at(g, 'p1', 'characters', KOU))).toBe(true);
    expect(trash(g)).toEqual([]);
  });

  it('"may": declining lets the Character be K.O.\'d and keeps Koushirou active', () => {
    const g = board([KOU, sai]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', sai));
    no(g, 'p1');
    expect(chars(g)).toEqual([KOU]);
    expect(trash(g)).toEqual([sai]);
    expect(isRested(g, at(g, 'p1', 'characters', KOU))).toBe(false);
  });

  it('boundary: cost 5 is covered (Tashigi 5), cost 6 is not (Kuro 6: no offer)', () => {
    const g = board([KOU, tashigi5]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', tashigi5));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([KOU, tashigi5].sort());
    const h = board([KOU, kuro6]);
    opponentKingdomCome(h, at(h, 'p1', 'characters', kuro6));
    expect(kind(h)).not.toBe('optional');
    expect(chars(h)).toEqual([KOU]);
    expect(trash(h)).toEqual([kuro6]);
  });

  it('a Character without the <Slash> attribute is not covered', () => {
    const g = board([KOU, marco]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', marco));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([marco]);
  });

  it('"other than this Character": Koushirou himself (a <Slash> Character of cost 2) is not covered', () => {
    const g = board([KOU, sai]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', KOU));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([sai]);
    expect(trash(g)).toEqual([KOU]);
  });

  it("a K.O. in battle is not an effect: no offer, the Character is K.O.'d", () => {
    const g = board([KOU, { card: wire, rested: true }]);
    attack(g, at(g, 'p2', 'characters', thatch), at(g, 'p1', 'characters', wire));
    noDefence(g);
    expect(chars(g)).toEqual([KOU]);
    expect(trash(g)).toEqual([wire]);
  });

  it("boundary: an already rested Koushirou cannot be rested again: no offer, the Character is K.O.'d", () => {
    const g = board([{ card: KOU, rested: true }, sai]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', sai));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([sai]);
  });

  it('two copies protect each other (QA-OP12 OP12-027): the K.O. of one is replaced by resting the other', () => {
    const g = board([KOU, KOU]);
    const a = at(g, 'p1', 'characters', KOU, 0);
    const b = at(g, 'p1', 'characters', KOU, 1);
    opponentKingdomCome(g, a);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([KOU, KOU]);
    expect(isRested(g, a)).toBe(false);
    expect(isRested(g, b)).toBe(true);
  });

  it('with two copies the Character is saved once only: the replaced K.O. is not asked again', () => {
    const g = board([KOU, KOU, sai]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', sai));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toHaveLength(3);
    const rested = g.zone('p1', 'characters').filter((c) => c.rested && c.card === KOU);
    expect(rested).toHaveLength(1);
  });
});
