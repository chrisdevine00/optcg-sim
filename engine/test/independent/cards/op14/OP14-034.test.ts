/**
 * OP14-034 Monkey.D.Luffy (Character, cost 3, 3000, Counter +1000, {FILM}/{Straw Hat Crew}/{Supernovas}).
 *
 * Card text: "[Your Turn] All of your green {Straw Hat Crew} type Characters with a base cost of 4 or
 * more gain +1000 power.
 * [Once Per Turn] If your {Straw Hat Crew} type Character would be K.O.'d by your opponent's effect,
 * you may rest 1 of your Characters instead."
 *
 * Rules: [Your Turn] limits the bonus to my turn; "base cost" ignores cost changes; it applies to
 * every matching Character (colour green AND type Straw Hat Crew AND base cost 4+). Two copies each
 * give it (permanent effects stack). The replacement is optional ("may"), covers a K.O. by the
 * opponent's EFFECT only (not battle), cannot be applied with no Character left to rest (RL-31),
 * and is [Once Per Turn] (CR 8-1-3-2).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  chr,
  endTurn,
  kind,
  LD14,
  mine,
  need,
  no,
  opponentKOs,
  passBlock,
  passCounter,
  payRest,
  S14,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op14a.ts';

const LUFFY = 'OP14-034';
const LIGHTNING = 'OP09-077';

describe('OP14-034 Luffy: [Your Turn] green {Straw Hat Crew} Characters with base cost 4 or more gain +1000', () => {
  function board(chars: string[]) {
    return mine(LD14.luffy, { characters: [LUFFY, ...chars] });
  }

  it('printed values: cost 3, 3000, Counter +1000; Luffy himself gets no bonus (base cost 3)', () => {
    const g = board([]);
    const l = at(g, 'p1', 'characters', LUFFY);
    expect(g.card(l).cost).toBe(3);
    expect(g.power(l)).toBe(3000);
    expect(g.card(l).counter).toBe(1000);
  });

  it('a green {Straw Hat Crew} Character with base cost 5 gains +1000 (7000 -> 8000)', () => {
    const g = board([S14.frankyG5]);
    expect(g.power(chr(g, 'p1', S14.frankyG5))).toBe(8000);
  });

  it('boundary: base cost 4 qualifies (OP02-043 Zoro 6000 -> 7000), base cost 3 does not (Usopp stays 5000)', () => {
    const g = board([S14.zoroSn, S14.usoppG3]);
    expect(g.power(chr(g, 'p1', S14.zoroSn))).toBe(7000);
    expect(g.power(chr(g, 'p1', S14.usoppG3))).toBe(5000);
  });

  it('a red {Straw Hat Crew} Character with cost 4 gets nothing (not green)', () => {
    const g = board([S14.frankyR4]);
    expect(g.power(chr(g, 'p1', S14.frankyR4))).toBe(6000);
  });

  it('a green Character with cost 5 that is not {Straw Hat Crew} gets nothing', () => {
    const g = board([S14.tashigiG5]);
    expect(g.power(chr(g, 'p1', S14.tashigiG5))).toBe(7000);
  });

  it('the opposing Characters and my Leader are unaffected', () => {
    const g = mine(
      LD14.luffy,
      { characters: [LUFFY, S14.frankyG5] },
      { characters: [S14.frankyG5] },
    );
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p2', S14.frankyG5))).toBe(7000);
  });

  it('two copies of Luffy both give it: +2000 in total', () => {
    const g = mine(LD14.luffy, { characters: [LUFFY, LUFFY, S14.frankyG5] });
    expect(g.power(chr(g, 'p1', S14.frankyG5))).toBe(9000);
  });

  it("on the opponent's turn there is no bonus ([Your Turn])", () => {
    const g = theirs(
      LD14.luffy,
      { characters: [LUFFY, S14.frankyG5] },
      { characters: [S14.dadan] },
    );
    expect(g.power(chr(g, 'p1', S14.frankyG5))).toBe(7000);
  });
});

describe('OP14-034 Luffy: [Once Per Turn] replacement: rest 1 of my Characters instead of a K.O. by an effect', () => {
  function defend(mychars: (string | { card: string; rested?: boolean })[], hand = [LIGHTNING]) {
    return theirs(
      LD14.croc,
      { characters: [LUFFY, ...mychars] },
      { hand, characters: [S14.dadan] },
    );
  }

  it('K.O. of a {Straw Hat Crew} Character by an opposing effect: accepting rests another of my Characters and it stays', () => {
    const g = defend([S14.usoppG3, S14.marco]);
    opponentKOs(g, chr(g, 'p1', S14.usoppG3));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payRest(g, [chr(g, 'p1', S14.marco)], 0);
    expect(chars(g)).toEqual([LUFFY, S14.marco, S14.usoppG3].sort());
    expect(g.card(chr(g, 'p1', S14.marco)).rested).toBe(true);
    expect(trash(g)).toEqual([]);
  });

  it('it can save Luffy himself (he is a {Straw Hat Crew} Character) by resting another Character', () => {
    const g = defend([S14.marco]);
    opponentKOs(g, at(g, 'p1', 'characters', LUFFY));
    yes(g, 'p1');
    payRest(g, [chr(g, 'p1', S14.marco)], 0);
    expect(chars(g)).toEqual([LUFFY, S14.marco].sort());
  });

  it('declining lets the K.O. happen and rests nothing', () => {
    const g = defend([S14.usoppG3, S14.marco]);
    opponentKOs(g, chr(g, 'p1', S14.usoppG3));
    no(g, 'p1');
    expect(chars(g)).toEqual([LUFFY, S14.marco].sort());
    expect(trash(g)).toEqual([S14.usoppG3]);
    expect(g.card(chr(g, 'p1', S14.marco)).rested).toBe(false);
  });

  it('a Character without the {Straw Hat Crew} type is not covered: no question, it is K.O.d', () => {
    const g = defend([S14.marco, S14.sai]);
    opponentKOs(g, chr(g, 'p1', S14.marco));
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([S14.marco]);
  });

  it('a K.O. in battle is not by an effect: it is not replaced', () => {
    const g = theirs(
      LD14.croc,
      { characters: [LUFFY, { card: S14.usoppG3, rested: true }, S14.marco] },
      { characters: [S14.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', S14.kingdew), chr(g, 'p1', S14.usoppG3));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([S14.usoppG3]);
  });

  it('[Once Per Turn]: a second {Straw Hat Crew} Character K.O.d the same turn is not saved', () => {
    const g = defend([S14.usoppG3, S14.usoppG3, S14.marco, S14.sai], [LIGHTNING, LIGHTNING]);
    opponentKOs(g, g.find('p1', 'characters', S14.usoppG3, 0));
    yes(g, 'p1');
    payRest(g, [chr(g, 'p1', S14.marco)], 0);
    opponentKOs(g, g.find('p1', 'characters', S14.usoppG3, 0));
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([S14.usoppG3]);
    expect(chars(g)).toEqual([LUFFY, S14.marco, S14.sai, S14.usoppG3].sort());
  });

  it('impossible replacement: with every one of my Characters already rested there is nothing to rest, so the K.O. happens', () => {
    const g = theirs(
      LD14.croc,
      {
        characters: [
          { card: LUFFY, rested: true },
          { card: S14.usoppG3, rested: true },
        ],
      },
      { hand: [LIGHTNING], characters: [S14.dadan] },
    );
    opponentKOs(g, chr(g, 'p1', S14.usoppG3));
    unusable(g, 'p1');
    expect(trash(g)).toEqual([S14.usoppG3]);
    expect(chars(g)).toEqual([LUFFY]);
  });

  it('the K.O. is replaced, so my Characters keep their position: nothing is lost this turn', () => {
    const g = defend([S14.usoppG3, S14.marco]);
    opponentKOs(g, chr(g, 'p1', S14.usoppG3));
    yes(g, 'p1');
    payRest(g, [chr(g, 'p1', S14.marco)], 0);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(chars(g)).toEqual([LUFFY, S14.marco, S14.usoppG3].sort());
    expect(g.card(chr(g, 'p1', S14.marco)).rested).toBe(false);
  });
});
