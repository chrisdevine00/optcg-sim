/**
 * OP16-085 Kouzuki Momonosuke (Character, Black, cost 9, 6000, Counter +1000, {Land of Wano}/{Kouzuki Clan}).
 *
 * Card text: "[Blocker] [On Play] Play up to 1 {Land of Wano} type Character card with a cost of 6 or
 * less other than [Kouzuki Momonosuke] from your trash."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 3-7-6 (five Character areas: a sixth Character forces a trash),
 * CR 10-1-4 ([Blocker]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  SCN,
  theirs,
  atMain,
  blockers,
  chars,
  decision,
  deckOf,
  hand,
  kind,
  LD16,
  need,
  none,
  offeredIds,
  p1main,
  pickCards,
  playIt,
  SC16,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-085';

function start(tr: string[], field: string[] = []) {
  const g = p1main(LD16.wano, { hand: [ID], trash: tr, characters: field, deck: deckOf([]) });
  playIt(g, ID);
  return g;
}

describe('OP16-085 Kouzuki Momonosuke: [Blocker]; [On Play] play a cheap {Land of Wano} Character from the trash', () => {
  it('plays the chosen {Land of Wano} Character (cost 6 allowed) from the trash onto the field', () => {
    const g = start([SC16.wano6, SC16.wano1]);
    need(g, 'choose', 'p1');
    pickCards(g, [SC16.wano6]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID, SC16.wano6].sort());
    expect(trash(g)).toEqual([SC16.wano1]);
  });

  it('boundary: cost 6 is offered, cost 7 is not', () => {
    const g = start([SC16.wano6, SC16.wano7, SC16.wano5]);
    expect(offeredIds(g)).toEqual([SC16.wano5, SC16.wano6].sort());
  });

  it('[Kouzuki Momonosuke] itself is excluded (by name), even with a low cost', () => {
    const g = start([SC16.momo2, SC16.momo6, SC16.wano1]);
    expect(offeredIds(g)).toEqual([SC16.wano1]);
  });

  it('only {Land of Wano} Characters: a non-{Land of Wano} Character and a {Land of Wano} Event are not offered', () => {
    const g = start([SC16.wano3, SCN.c3 /* Marco: Red, cost 3, not {Land of Wano} */, 'OP16-099']);
    expect(offeredIds(g)).toEqual([SC16.wano3]);
  });

  it('"up to 1": may play nothing; the trash is unchanged', () => {
    const g = start([SC16.wano3]);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([SC16.wano3]);
  });

  it('plays only one card even when several qualify', () => {
    const g = start([SC16.wano3, SC16.wano1, SC16.wano5]);
    pickCards(g, [SC16.wano3]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toHaveLength(2);
    expect(trash(g)).toHaveLength(2);
  });

  it('nothing qualifying in the trash: no prompt that can play anything, back to the Main Phase', () => {
    const g = start([SC16.wano7, SC16.momo2]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID]);
  });

  it('has [Blocker] and can block for the Leader', () => {
    const g = theirs(LD16.wano, { characters: [ID] }, { characters: [SC16.wano6] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
  });

  it('with four other Characters, the played one is a sixth: I must trash one (Character limit), ending with five', () => {
    const field = [SC16.wano1, SC16.wano3, SC16.wano5, SC16.wano6];
    const g = start([SC16.wano3], field);
    // field: 4 + Momonosuke = 5, so the played card makes 6
    pickCards(g, [SC16.wano3]);
    expect(decision(g)?.purpose).toBe('characterLimit');
    const victim = at(g, 'p1', 'characters', SC16.wano1);
    act(g, { type: 'pick', choice: victim });
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toHaveLength(5);
    expect(hand(g)).toEqual([]);
  });
});
