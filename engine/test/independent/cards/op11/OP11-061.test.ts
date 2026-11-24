/**
 * OP11-061 Gum-Gum Jet Culverin (Blue Event, cost 3, {Straw Hat Crew}).
 *
 * Card text: "[Main] Place up to 1 of your opponent's Characters with a base cost of 4 or less at the
 * bottom of the owner's deck. [Trigger] Place up to 1 Character with a cost of 1 or less at the
 * bottom of the owner's deck."
 *
 * Rules: [Main] targets only the opponent's Characters (base cost 4 or less, inclusive); [Trigger]
 * names no side, so my own Characters qualify too (cost 1 or less). The card goes to the bottom of
 * its owner's deck. "Up to 1" may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  attack,
  BLUE,
  C11,
  chars,
  deck,
  donOf,
  fill,
  kind,
  L11,
  mine,
  need,
  noDefenceUntilTrigger,
  none,
  offeredIds,
  pickInst,
  playCard,
  settleNoCandidates,
  theirs,
  trash,
} from './kit-op11b.ts';

const CULVERIN = 'OP11-061';

function main(p1chars: string[], p2chars: string[]) {
  const g = mine(L11.mono, { hand: [CULVERIN], characters: p1chars }, { characters: p2chars });
  playCard(g, CULVERIN);
  return g;
}

function trigger(p1chars: string[], p2chars: string[]) {
  const g = theirs(
    L11.mono,
    { life: [CULVERIN, ...fill(BLUE, 3)], characters: p1chars },
    { characters: p2chars },
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  noDefenceUntilTrigger(g);
  activateTrigger(g);
  return g;
}

describe('OP11-061 Gum-Gum Jet Culverin: [Main] bottom-deck an opposing Character, base cost 4 or less', () => {
  it('offers only the opponent Characters with cost 4 or less (4 is in, 5 is out), never mine', () => {
    const g = main([C11.c1], [C11.c2, C11.c4, C11.c5, C11.c6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c2, C11.c4].sort());
  });

  it("the chosen Character goes to the bottom of the opponent's deck", () => {
    const g = main([], [C11.c4, C11.c2]);
    pickInst(g, [at(g, 'p2', 'characters', C11.c4)]);
    expect(chars(g, 'p2')).toEqual([C11.c2]);
    expect(deck(g, 'p2')).toHaveLength(16);
    expect(deck(g, 'p2')[15]).toBe(C11.c4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = main([], [C11.c2]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([C11.c2]);
    expect(deck(g, 'p2')).toHaveLength(15);
  });

  it('only one Character is placed even when two qualify', () => {
    const g = main([], [C11.c2, C11.c3]);
    pickInst(g, [at(g, 'p2', 'characters', C11.c3)]);
    expect(chars(g, 'p2')).toEqual([C11.c2]);
    expect(kind(g)).toBe('main');
  });

  it('with no qualifying Character (only cost 5 or more) nothing happens', () => {
    const g = main([C11.c1], [C11.c5]);
    settleNoCandidates(g, false);
    expect(chars(g, 'p2')).toEqual([C11.c5]);
    expect(chars(g)).toEqual([C11.c1]);
  });

  it('the Event costs 3 DON!! and ends in the trash', () => {
    const g = main([], [C11.c2]);
    pickInst(g, [at(g, 'p2', 'characters', C11.c2)]);
    expect(donOf(g, 'p1').rested).toBe(3);
    expect(trash(g)).toEqual([CULVERIN]);
  });
});

describe('OP11-061 Gum-Gum Jet Culverin: [Trigger] bottom-deck any Character with cost 1 or less', () => {
  it('offers Characters of cost 1 or less on both sides (cost 2 is out)', () => {
    const g = trigger([C11.c1, C11.c2], [C11.shc1, C11.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c1, C11.shc1].sort());
  });

  it("my own Character goes to the bottom of MY deck; an opponent's to the bottom of theirs", () => {
    const g = trigger([C11.c1], [C11.shc1]);
    pickInst(g, [at(g, 'p1', 'characters', C11.c1)]);
    expect(chars(g)).toEqual([]);
    expect(deck(g)[deck(g).length - 1]).toBe(C11.c1);
    expect(chars(g, 'p2')).toEqual([C11.shc1]);

    const h = trigger([C11.c1], [C11.shc1]);
    pickInst(h, [at(h, 'p2', 'characters', C11.shc1)]);
    expect(chars(h, 'p2')).toEqual([]);
    expect(deck(h, 'p2')[deck(h, 'p2').length - 1]).toBe(C11.shc1);
  });

  it('"up to 1": may place nothing', () => {
    const g = trigger([C11.c1], [C11.shc1]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([C11.c1]);
    expect(chars(g, 'p2')).toEqual([C11.shc1]);
  });

  it('with no Character of cost 1 or less nothing happens', () => {
    const g = trigger([C11.c2], [C11.c3]);
    settleNoCandidates(g, false);
    expect(chars(g)).toEqual([C11.c2]);
    expect(chars(g, 'p2')).toEqual([C11.c3]);
  });
});
