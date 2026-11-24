/**
 * OP15-009 Koby (Character, Red, cost 1, 2000, Counter +2000, {Navy}/{East Blue}).
 *
 * Card text: "If your Character with 7000 base power or less would be removed from the field by your
 * opponent's effect, you may give your Leader -2000 power during this turn instead."
 *
 * Rules: CR 8-1-3-4 (replacement effects; "may" makes it optional, CR 8-1-3-4-1), CR 10-2-1-3 (a
 * K.O. in battle is not "removed by an effect"), base power ignores DON!! and modifiers (CR 2-9),
 * "during this turn" ends with the turn (CR 8-4-2-2).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from './kit-op15a.ts';
import {
  at,
  chars,
  act,
  kind,
  KINGDOM_COME,
  payHand,
  pickInst,
  playRaw,
  S15,
  LD15,
  leaderPower,
  need,
  no,
  opponentKingdomCome,
  opponentKOs,
  SC2,
  SCN,
  theirs,
  trash,
  yes,
} from './kit-op15a.ts';

const KOBY = 'OP15-009';

/** p2's turn: p1 has Koby and `mine`; p2 holds Kingdom Come (cost 6, K.O. any Character). */
function board(
  mineChars: (string | { card: string; don?: number; rested?: boolean })[] = [SCN.c5],
  p2hand: string[] = [KINGDOM_COME],
) {
  return theirs(
    LD15.luffy,
    { characters: [KOBY, ...mineChars] },
    { hand: p2hand, characters: [SCN.c3] },
  );
}

describe('OP15-009 Koby: -2000 Leader power instead of removal by an opposing effect', () => {
  it('a 7000 base power Character K.O.d by an opposing effect: I am offered the replacement; yes keeps it and the Leader gets -2000', () => {
    const g = board();
    opponentKingdomCome(g, at(g, 'p1', 'characters', SCN.c5));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([KOBY, SCN.c5].sort());
    expect(trash(g)).toEqual([]);
    expect(leaderPower(g, 'p1')).toBe(3000);
  });

  it('declining ("may") lets the K.O. happen and the Leader keeps its power', () => {
    const g = board();
    opponentKingdomCome(g, at(g, 'p1', 'characters', SCN.c5));
    no(g, 'p1');
    expect(chars(g)).toEqual([KOBY]);
    expect(trash(g)).toEqual([SCN.c5]);
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('boundary: an 8000 base power Character is not protected (no offer, K.O.d)', () => {
    const g = board([SCN.c6]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', SCN.c6));
    need(g, 'main', 'p2');
    expect(chars(g)).toEqual([KOBY]);
    expect(trash(g)).toEqual([SCN.c6]);
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('"base" power: an 8000 base Character lowered to 3000 by an opposing effect is still not protected', () => {
    const MOLE_PISTOL = 'ST21-017'; // [Main] Give up to 1 opposing Character -5000 power this turn. Then (with a 6000+ Character) K.O. up to 1 with 2000 or less.
    const g = theirs(
      LD15.luffy,
      { characters: [KOBY, SCN.c6] },
      { hand: [MOLE_PISTOL, SC2.lightning], characters: [SCN.c2] },
    );
    playRaw(g, MOLE_PISTOL);
    need(g, 'choose', 'p2');
    act(g, { type: 'pick', choice: at(g, 'p1', 'characters', SCN.c6) });
    if (kind(g) === 'choose') act(g, { type: 'done' });
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p1', 'characters', SCN.c6))).toBe(3000);
    opponentKOs(g, at(g, 'p1', 'characters', SCN.c6));
    need(g, 'main', 'p2');
    expect(trash(g)).toEqual([SCN.c6]);
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('Koby itself (2000 base power) is covered by its own effect', () => {
    const g = board([]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', KOBY));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([KOBY]);
    expect(leaderPower(g, 'p1')).toBe(3000);
  });

  it('a K.O. in battle is not removal by an effect: no offer, the Character is K.O.d', () => {
    const g = theirs(
      LD15.luffy,
      { characters: [KOBY, { card: SCN.c3, rested: true }] },
      { characters: [SCN.c5] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c5), at(g, 'p1', 'characters', SCN.c3));
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p2');
    expect(trash(g)).toEqual([SCN.c3]);
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('the -2000 ends with the turn: my Leader is back to 5000 in my next turn', () => {
    const g = board();
    opponentKingdomCome(g, at(g, 'p1', 'characters', SCN.c5));
    yes(g, 'p1');
    expect(leaderPower(g, 'p1')).toBe(3000);
    g.act({ type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('every removal in the turn can be replaced: two replacements give -4000 (1000 left)', () => {
    const g = theirs(
      LD15.luffy,
      { characters: [KOBY, SCN.c3, SCN.c4] },
      { hand: [SC2.lightning, SC2.lightning], characters: [SCN.c2] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', SCN.c3));
    yes(g, 'p1');
    expect(leaderPower(g, 'p1')).toBe(3000);
    opponentKOs(g, at(g, 'p1', 'characters', SCN.c4));
    yes(g, 'p1');
    expect(leaderPower(g, 'p1')).toBe(1000);
    expect(chars(g)).toEqual([KOBY, SCN.c3, SCN.c4].sort());
  });

  it('"removed from the field" is not only K.O.: a bottom-of-deck placement by an opposing effect (ST33-003 Smoker) is replaced too', () => {
    const SMOKER = 'ST33-003'; // [On Play] You may trash 1 card from your hand: Place up to 2 of your opponent's Characters with a cost of 2 or less at the bottom of the owner's deck.
    const g = theirs(
      LD15.luffy,
      { characters: [KOBY, S15.bellamy] },
      { hand: [SMOKER, SCN.c1], characters: [SCN.c3] },
    );
    playRaw(g, SMOKER);
    need(g, 'optional', 'p2');
    yes(g, 'p2');
    payHand(g, [SCN.c1]);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', S15.bellamy)]);
    if (kind(g) === 'choose') act(g, { type: 'done' });
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([KOBY, S15.bellamy].sort());
    expect(leaderPower(g, 'p1')).toBe(3000);
  });

  it('without Koby the same K.O. just happens', () => {
    const g = theirs(LD15.luffy, { characters: [SCN.c5] }, { hand: [KINGDOM_COME] });
    opponentKingdomCome(g, at(g, 'p1', 'characters', SCN.c5));
    need(g, 'main', 'p2');
    expect(trash(g)).toEqual([SCN.c5]);
  });
});
