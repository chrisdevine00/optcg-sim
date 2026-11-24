/**
 * EB04-010 Lulucia Kingdom (Stage, cost 7, {Lulucia Kingdom}).
 *
 * Card text: "[Opponent's Turn] All of your Characters with a base cost of 1 gain +5000 power.
 * [On Play] Set the power of up to 1 of your opponent's Characters to 0 during this turn."
 *
 * Rules: CR 8-4-4-1 ("up to"), "base cost" is the printed cost (cost modifiers ignored), a Stage
 * leaves the field when another Stage is played (CR 3-8-? one Stage at a time), "during this turn"
 * ends at the end of the turn, [Opponent's Turn] effects apply on the opponent's turn only.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cardIds,
  choices,
  endTurn,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  noDefence,
  none,
  p2attacks,
  offeredIds,
  pickInst,
  playRaw,
  SN,
  theirs,
  trash,
} from './kit-eb04a.ts';

const STAGE = 'EB04-010';
const OTHER_STAGE = 'OP05-021';

function play(p2chars: string[] = [SN.c5, SN.c3], p1: Parameters<typeof mine>[1] = {}) {
  const g = mine(LE.luffy, { hand: [STAGE], characters: [SN.c2], ...p1 }, { characters: p2chars });
  playRaw(g, STAGE);
  return g;
}

describe('EB04-010 Lulucia Kingdom: [On Play] set the power of up to 1 opposing Character to 0 this turn', () => {
  it('printed values: Stage, cost 7; playing it leaves it in the Stage area', () => {
    const g = mine(LE.luffy, { hand: [STAGE] }, { characters: [SN.c5] });
    expect(g.card(g.find('p1', 'hand', STAGE)).cost).toBe(7);
    playRaw(g, STAGE);
    need(g, 'choose');
    none(g);
    expect(cardIds(g, 'p1', 'stage')).toEqual([STAGE]);
  });

  it('sets the chosen Character to 0, the other opposing Character is untouched', () => {
    const g = play();
    const target = at(g, 'p2', 'characters', SN.c5);
    pickInst(g, [target]);
    expect(g.power(target)).toBe(0);
    expect(g.power(at(g, 'p2', 'characters', SN.c3))).toBe(5000);
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": may choose nobody; only opposing Characters are candidates (not mine, no Leader)', () => {
    const g = play();
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c3, SN.c5].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(7000);
  });

  it('the power is 0 only this turn: it is back to normal on the opponent turn', () => {
    const g = play();
    const target = at(g, 'p2', 'characters', SN.c5);
    pickInst(g, [target]);
    endTurn(g);
    expect(g.power(target)).toBe(7000);
  });

  it('no opposing Character: nothing to set, the Stage is played all the same', () => {
    const g = play([]);
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'stage')).toEqual([STAGE]);
  });

  it("a Character set to 0 is not K.O.'d by the effect itself", () => {
    const g = play([SN.c1]);
    pickInst(g, [at(g, 'p2', 'characters', SN.c1)]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SN.c1]);
  });
});

describe("EB04-010 Lulucia Kingdom: [Opponent's Turn] my Characters with base cost 1 gain +5000", () => {
  const board = (extra: Parameters<typeof theirs>[1] = {}) =>
    theirs(
      LE.luffy,
      { stage: STAGE, characters: [SN.c1, SN.c2, SN.tristan], ...extra },
      { characters: [SN.c4] },
    );

  it('on the opponent turn every base-cost-1 Character of mine gets +5000; other costs do not', () => {
    const g = board();
    expect(g.power(at(g, 'p1', 'characters', SN.c1))).toBe(8000);
    expect(g.power(at(g, 'p1', 'characters', SN.tristan))).toBe(8000);
    expect(g.power(at(g, 'p1', 'characters', SN.c2))).toBe(4000);
  });

  it('must not happen: on my own turn they keep their printed power', () => {
    const g = mine(LE.luffy, { stage: STAGE, characters: [SN.c1] }, { characters: [SN.c4] });
    expect(g.power(at(g, 'p1', 'characters', SN.c1))).toBe(3000);
  });

  it('must not happen: the bonus is for my Characters only, not the opponent cost-1 Characters or my Leader', () => {
    const g = theirs(LE.luffy, { stage: STAGE, characters: [SN.c1] }, { characters: [SN.c1] });
    expect(g.power(at(g, 'p2', 'characters', SN.c1))).toBe(3000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("in battle: a rested cost-1 Character (3000 + 5000) survives a 6000 attacker; without the Stage it would be K.O.'d", () => {
    const g = board({ characters: [{ card: SN.c1, rested: true }] });
    p2attacks(g, SN.c4, at(g, 'p1', 'characters', SN.c1));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SN.c1]);
    const h = theirs(
      LE.luffy,
      { characters: [{ card: SN.c1, rested: true }] },
      { characters: [SN.c4] },
    );
    p2attacks(h, SN.c4, at(h, 'p1', 'characters', SN.c1));
    noDefence(h);
    expect(cardIds(h, 'p1', 'characters')).toEqual([]);
  });

  it('the bonus ends when the Stage is replaced by another Stage', () => {
    const g = mine(
      LE.luffy,
      { stage: STAGE, hand: [OTHER_STAGE], characters: [SN.c1] },
      { characters: [SN.c4] },
    );
    playRaw(g, OTHER_STAGE);
    expect(cardIds(g, 'p1', 'stage')).toEqual([OTHER_STAGE]);
    expect(trash(g)).toContain(STAGE);
    endTurn(g);
    expect(g.power(at(g, 'p1', 'characters', SN.c1))).toBe(3000);
  });
});
