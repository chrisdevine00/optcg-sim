/**
 * OP16-083 Kouzuki Oden (Character, Black, cost 5, 6000, Counter +1000, {Land of Wano}/{Kouzuki Clan}).
 *
 * Card text: "[Blocker] [On Play] You may trash 1 Character card with a cost of 8 or more from your
 * hand: Draw 2 cards."
 *
 * Rules: CR 8-3-1-3 (a cost that cannot be paid cannot be paid), CR 10-1-4 ([Blocker]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  blockers,
  deckOf,
  describeTrash8Draw2,
  kind,
  LD16,
  no,
  p1main,
  playIt,
  SC16,
  theirs,
} from './kit-op16c.ts';

const ID = 'OP16-083';

describeTrash8Draw2(ID);

describe('OP16-083 Kouzuki Oden: [Blocker]', () => {
  it('has [Blocker] on the field', () => {
    const g = p1main(LD16.wano, { hand: [ID], deck: deckOf([]) });
    playIt(g, ID);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('can be rested to become the new target of an attack on my Leader', () => {
    const g = theirs(LD16.wano, { characters: [ID] }, { characters: [SC16.wano6] });
    const oden = at(g, 'p1', 'characters', ID);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([oden]);
    act(g, { type: 'block', blocker: oden });
    expect(g.card(oden).rested).toBe(true);
  });
});
