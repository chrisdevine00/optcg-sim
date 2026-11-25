/**
 * PRB02-013 Gecko Moria (Character, cost 6, 7000, no Counter, {The Seven Warlords of the Sea}/
 * {Thriller Bark Pirates}).
 *
 * Card text: "[On Play] If your Leader has the "Thriller Bark Pirates" type, play up to 1 Character card
 * with a cost of 4 or less from your trash rested. Then, give up to 1 rested DON!! card to your
 * Leader or 1 of your Characters."
 *
 * Rules: "If" gates the whole effect and a "Then" after a failed "If" does not resolve (M4b-5).
 * Playing from the trash by an effect costs nothing and puts the Character in the field in the state
 * the text names (rested). "Up to 1" may be answered with nothing. Only a rested DON!! can be given
 * by this effect; it stays attached and gives +1000 power during its owner's turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMainOf,
  choices,
  donStr,
  kind,
  LDP,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  playRaw,
  SP,
  sorted,
  trash,
} from './kit-prb02sta.ts';

const MO = 'PRB02-013';
const TRASH = [SP.c4p6, SP.c5p7, SP.c3p5, SP.event, SP.c1p3];

function play(leader: string, tr: string[] = TRASH, chars: string[] = []) {
  const g = mine(leader, { hand: [MO], trash: tr, characters: chars });
  playRaw(g, MO);
  return g;
}

describe('PRB02-013 Gecko Moria: [On Play] if {Thriller Bark Pirates} Leader, play a cost 4 or less Character from trash rested; then give 1 rested DON!!', () => {
  it('printed values: cost 6, 7000 power, no Counter', () => {
    const g = mine(LDP.tbp, { characters: [MO] });
    const i = at(g, 'p1', 'characters', MO);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([6, 7000, null]);
  });

  it('offers exactly the Character cards with cost 4 or less in the trash (cost 4, 3, 1 yes; cost 5 and an Event no)', () => {
    const g = play(LDP.tbp);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c4p6, SP.c3p5, SP.c1p3].sort());
  });

  it('the chosen Character enters the field RESTED, for free, from the trash', () => {
    const g = play(LDP.tbp);
    pickCards(g, [SP.c4p6]);
    const i = at(g, 'p1', 'characters', SP.c4p6);
    expect(g.card(i).rested).toBe(true);
    expect(trash(g)).not.toContain(SP.c4p6);
    expect(donStr(g, 'p1')).toBe('4/6/0');
  });

  it('then offers the Leader, Moria and the Character just played as recipients of 1 rested DON!!', () => {
    const g = play(LDP.tbp);
    pickCards(g, [SP.c4p6]);
    need(g, 'choose', 'p1');
    expect([...choices(g)].sort()).toEqual(
      [g.leader('p1'), at(g, 'p1', 'characters', MO), at(g, 'p1', 'characters', SP.c4p6)].sort(),
    );
  });

  it('gives exactly 1 rested DON!! to the chosen target (+1000 power) and asks nothing more', () => {
    const g = play(LDP.tbp);
    pickCards(g, [SP.c4p6]);
    pickInst(g, [g.leader('p1')]);
    expect(donStr(g, 'p1')).toBe('4/5/1');
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(atMainOf(g)).toBe(true);
  });

  it('"up to 1" for the play: choosing nothing plays nothing, and the DON!! step still follows', () => {
    const g = play(LDP.tbp);
    need(g, 'choose', 'p1');
    none(g);
    expect(sorted(g, 'p1', 'characters')).toEqual([MO]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', MO)]);
    expect(donStr(g, 'p1')).toBe('4/5/1');
  });

  it('"up to 1" for the DON!!: choosing nothing gives none', () => {
    const g = play(LDP.tbp);
    pickCards(g, [SP.c1p3]);
    need(g, 'choose', 'p1');
    none(g);
    expect(donStr(g, 'p1')).toBe('4/6/0');
    expect(atMainOf(g)).toBe(true);
  });

  it('an empty trash: nothing to play, the "Then" still gives the DON!!', () => {
    const g = play(LDP.tbp, []);
    if (kind(g) === 'choose' && choices(g).length === 0) none(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(donStr(g, 'p1')).toBe('4/5/1');
  });

  it('Leader without {Thriller Bark Pirates}: nothing is played, no DON!! is given, nothing is asked', () => {
    const g = play(LDP.neutral);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([...TRASH].sort());
    expect(donStr(g, 'p1')).toBe('4/6/0');
    expect(sorted(g, 'p1', 'characters')).toEqual([MO]);
  });

  it('only 1 Character is played even with several eligible cards in the trash', () => {
    const g = play(LDP.tbp);
    pickCards(g, [SP.c4p6]);
    pickInst(g, [g.leader('p1')]);
    expect(sorted(g, 'p1', 'characters')).toEqual([MO, SP.c4p6].sort());
    expect(trash(g)).toHaveLength(TRASH.length - 1);
  });
});
