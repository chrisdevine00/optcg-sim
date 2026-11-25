/**
 * OP09-028 Sanji (Character, Green, cost 5, 6000, Counter +1000, {Straw Hat Crew}/{ODYSSEY}).
 *
 * Card text: "[On K.O.] You may add 1 card from the top or bottom of your Life cards to your hand:
 * Play up to 1 "ODYSSEY" or "Straw Hat Crew" type Character card with a cost of 4 or less from your
 * trash rested."
 *
 * Rules: [On K.O.] activates when this Character is K.O.'d (in battle or by an effect); the text
 * before the colon is an optional cost (it needs at least 1 Life card; the player picks top or
 * bottom); the played card comes from the TRASH and enters RESTED; "up to 1" may be 0 (CR 8-4-4-1);
 * types are matched exactly (CR 2-1); cost 4 is allowed, 5 is not; a card played by an effect pays
 * no cost.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  chars,
  choices,
  hand,
  kind,
  L9,
  lifeCards,
  need,
  no,
  none,
  offeredIds,
  opponentKOs,
  pickInst,
  pickLife,
  S9,
  SC2,
  theirs,
  trash,
  unusable,
  yes,
  type Place,
} from './kit-op09a.ts';

const SANJI = 'OP09-028';
const LIFE = [S9.c1, S9.c2, S9.c3, S9.mohji]; // top first

/** p2's turn: p1's rested Sanji is attacked by a 7000 Character and K.O.d; `trashCards` are in my trash. */
function koed(trashCards: string[], life: string[] = LIFE, own: Place[] = []): TestGame {
  const g = theirs(
    L9.luffy,
    { characters: [{ card: SANJI, rested: true }, ...own], trash: trashCards, life },
    { characters: [S9.c5] },
  );
  attack(g, at(g, 'p2', 'characters', S9.c5), at(g, 'p1', 'characters', SANJI));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('OP09-028 Sanji: [On K.O.] you may add 1 Life card to hand: play up to 1 ODYSSEY / Straw Hat Crew Character (cost ≤4) from the trash rested', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = theirs(L9.luffy, { characters: [SANJI] }, {});
    const s = at(g, 'p1', 'characters', SANJI);
    expect(g.card(s).cost).toBe(5);
    expect(g.power(s)).toBe(6000);
    expect(g.card(s).counter).toBe(1000);
  });

  it('K.O.d in battle: pay the TOP Life card to hand and play a Character from the trash rested', () => {
    const g = koed([S9.lucci]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    pickLife(g, 'top');
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'trash', S9.lucci)]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([S9.c1]);
    expect(lifeCards(g)).toEqual([S9.c2, S9.c3, S9.mohji]);
    expect(chars(g)).toEqual([S9.lucci]);
    expect(g.card(at(g, 'p1', 'characters', S9.lucci)).rested).toBe(true);
    expect(trash(g)).toEqual([SANJI]);
  });

  it('I may pay with the BOTTOM Life card instead', () => {
    const g = koed([S9.lucci]);
    yes(g, 'p1');
    pickLife(g, 'bottom');
    pickInst(g, [g.find('p1', 'trash', S9.lucci)]);
    expect(hand(g)).toEqual([S9.mohji]);
    expect(lifeCards(g)).toEqual([S9.c1, S9.c2, S9.c3]);
  });

  it('"you may": declining pays nothing and plays nothing', () => {
    const g = koed([S9.lucci]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
    expect(lifeCards(g)).toEqual(LIFE);
    expect(chars(g)).toEqual([]);
  });

  it('only {ODYSSEY} or {Straw Hat Crew} Characters with cost 4 or less are offered', () => {
    // Lucci: ODYSSEY, cost 4. Franky (ST01-010): Straw Hat Crew, cost 4. Lim (OP03-015): ODYSSEY, cost 3.
    // Franky (OP02-039): Straw Hat Crew, cost 5 (too dear). Hajrudin: cost 4 without either type.
    const g = koed([S9.lucci, S9.frankyR4, S9.limBlocker, S9.frankyG5, S9.c4]);
    yes(g, 'p1');
    pickLife(g, 'top');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.frankyR4, S9.limBlocker, S9.lucci].sort());
  });

  it('"up to 1": after paying I may play nothing (the Life card stays in my hand)', () => {
    const g = koed([S9.lucci]);
    yes(g, 'p1');
    pickLife(g, 'top');
    need(g, 'choose', 'p1');
    none(g);
    expect(hand(g)).toEqual([S9.c1]);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([S9.lucci, SANJI].sort());
  });

  it('the cost needs a Life card: with 0 Life it cannot be paid and nothing is played', () => {
    const g = koed([S9.lucci], []);
    unusable(g, 'p1');
    expect(kind(g)).not.toBe('choose');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toContain(S9.lucci);
  });

  it('the Character played from the trash pays no cost (I have 0 active DON!!)', () => {
    const g = koed([S9.lucci]);
    yes(g, 'p1');
    pickLife(g, 'top');
    pickInst(g, [g.find('p1', 'trash', S9.lucci)]);
    expect(chars(g)).toEqual([S9.lucci]);
  });

  it('it also fires when an opposing effect K.O.s Sanji (Gum-Gum Lightning)', () => {
    const g = theirs(
      L9.luffy,
      { characters: [SANJI], trash: [S9.lucci], life: LIFE },
      { hand: [SC2.lightning], characters: [S9.c3] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', SANJI));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    pickLife(g, 'top');
    expect(choices(g)).toContain(g.find('p1', 'trash', S9.lucci));
  });

  it('must not happen: it does not fire when Sanji merely survives a battle', () => {
    const g = theirs(
      L9.luffy,
      { characters: [{ card: SANJI, rested: true }], trash: [S9.lucci] },
      { characters: [S9.c2] },
    );
    attack(g, at(g, 'p2', 'characters', S9.c2), at(g, 'p1', 'characters', SANJI));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([SANJI]);
  });
});
