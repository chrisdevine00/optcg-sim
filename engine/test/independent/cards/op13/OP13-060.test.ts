/**
 * OP13-060 Amatsuki Toki (Character, Purple, cost 2, 3000, Counter +1000, {Land of Wano}/{Roger Pirates}).
 *
 * Card text: "If your Character with a type including "Roger Pirates" would be K.O.'d by your opponent's
 * effect, you may trash this Character instead."
 *
 * Rules: CR 10-2-1-3 / rulings RL-31 (replacement effects, "may ... instead"), CR 2-4-3-1 ("type
 * including" matches "Former Roger Pirates"), CR 8-1-3-4 (a replaced event does not happen), and a
 * battle K.O. is not an effect (rules-digest, battle versus effect).
 * Scenery: OP12-012 Buggy (Roger Pirates, 2000, inert), OP13-068 Douglas Bullet (Former Roger Pirates,
 * 4000, inert on the field), OP01-023 Marco (5000, no Roger Pirates).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  bounce,
  battleOn,
  chars,
  decline,
  defend,
  hand,
  kind,
  ko,
  LD13,
  me,
  need,
  no,
  opponentKOs,
  S13,
  trash,
  yes,
  ch,
} from './kit-op13c.ts';

const ID = 'OP13-060';
const BULLET = 'OP13-068';

describe('OP13-060 Amatsuki Toki: my Roger Pirates Character K.O.’d by the opponent’s effect: may trash this instead', () => {
  it('offered for a Roger Pirates Character; accepting trashes Toki and the K.O. does not happen', () => {
    const g = defend(LD13.plain, { characters: [ID, S13.rp2] });
    ko(g, ch(g, 'p1', S13.rp2));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([S13.rp2]);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"you may": declining lets the K.O. happen and keeps Toki', () => {
    const g = defend(LD13.plain, { characters: [ID, S13.rp2] });
    ko(g, ch(g, 'p1', S13.rp2));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([S13.rp2]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"type including": a {Former Roger Pirates} Character is covered', () => {
    const g = defend(LD13.plain, { characters: [ID, BULLET] });
    ko(g, ch(g, 'p1', BULLET));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(chars(g)).toEqual([BULLET]);
    expect(trash(g)).toEqual([ID]);
  });

  it('must not: a Character without a Roger Pirates type is not covered (no prompt, it is K.O.’d)', () => {
    const g = defend(LD13.plain, { characters: [ID, S13.c3] });
    ko(g, ch(g, 'p1', S13.c3));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([S13.c3]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('a battle K.O. is not an effect: no prompt, the Roger Pirates Character is K.O.’d', () => {
    const g = defend(LD13.plain, { characters: [ID, { card: S13.rp2, rested: true }] });
    battleOn(g, ch(g, 'p1', S13.rp2));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([S13.rp2]);
  });

  it('only K.O. is replaced: a return to hand by the opponent’s effect is not', () => {
    const g = defend(LD13.plain, { characters: [ID, S13.rp2] });
    bounce(g, ch(g, 'p1', S13.rp2));
    expect(kind(g)).not.toBe('optional');
    expect(hand(g)).toEqual([S13.rp2]);
    expect(chars(g)).toEqual([ID]);
  });

  it('Toki herself (a Roger Pirates Character) K.O.’d by an effect ends in the trash whichever way the offer is answered', () => {
    const g = defend(LD13.plain, { characters: [ID] });
    ko(g, ch(g, 'p1', ID));
    if (kind(g) === 'optional') yes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('only my own Characters are covered: the opponent’s Roger Pirates Character is K.O.’d by my effect without a prompt', () => {
    const g = me(LD13.plain, { hand: ['OP09-077'], characters: [ID] }, { characters: [S13.rp2] });
    opponentKOs(g, ch(g, 'p2', S13.rp2));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([S13.rp2]);
    expect(chars(g)).toEqual([ID]);
  });

  it('Toki in my hand protects nothing', () => {
    const g = defend(LD13.plain, { characters: [S13.rp2], hand: [ID] });
    ko(g, ch(g, 'p1', S13.rp2));
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([S13.rp2]);
    expect(hand(g)).toEqual([ID]);
  });

  it('must not: with two Tokis one K.O. is replaced once, only one Toki is trashed', () => {
    const g = defend(LD13.plain, { characters: [ID, ID, S13.rp2] });
    ko(g, ch(g, 'p1', S13.rp2));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'optional') decline(g);
    expect(chars(g)).toEqual([ID, S13.rp2].sort());
    expect(trash(g)).toEqual([ID]);
  });
});
