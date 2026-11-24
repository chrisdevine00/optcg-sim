/**
 * ST29-002 Usopp (Character, Yellow, cost 3, 4000, Counter +1000, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "[On Play] / [When Attacking] Rest up to 1 of your opponent's Characters with a cost equal
 * to or less than the number of your opponent's Life cards."
 *
 * Rules: the threshold is the OPPONENT's Life count at resolution; "equal to or less" includes the
 * boundary; "up to 1" lets the player choose nothing (CR 8-4-4-1); the effect has two timings that
 * share one text.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  C29,
  fill,
  inst,
  isMain,
  kind,
  L29,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  settleEmpty,
} from './kit-st29a.ts';

const ID = 'ST29-002';

/** p1's Main Phase with Usopp in hand; the opponent has `p2life` Life and these Characters. */
function inHand(p2life: number, p2chars: string[]) {
  return mine(L29.croc, { hand: [ID] }, { life: fill(C29.c1, p2life), characters: p2chars });
}

/** Usopp already on my board (not played this turn) ready to attack the opponent's Leader. */
function onBoard(p2life: number, p2chars: string[]) {
  return mine(L29.croc, { characters: [ID] }, { life: fill(C29.c1, p2life), characters: p2chars });
}

describe("ST29-002 Usopp: rest an opposing Character with cost <= the opponent's Life", () => {
  it('printed values: cost 3, 4000 power, Counter +1000', () => {
    const g = inHand(4, []);
    const u = inst(g, 'p1', 'hand', ID);
    expect(g.card(u).cost).toBe(3);
    expect(g.card(u).power).toBe(4000);
    expect(g.card(u).counter).toBe(1000);
  });

  it('[On Play] with 3 opposing Life offers exactly the Characters with cost 3 or less', () => {
    const g = inHand(3, [C29.c1, C29.c3, C29.c4, C29.c5]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c1, C29.c3].sort());
  });

  it('[On Play] rests the chosen Character and leaves the others active', () => {
    const g = inHand(3, [C29.c1, C29.c3]);
    playRaw(g, ID);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c3)]);
    expect(g.card(inst(g, 'p2', 'characters', C29.c3)).rested).toBe(true);
    expect(g.card(inst(g, 'p2', 'characters', C29.c1)).rested).toBe(false);
    expect(isMain(g, 'p1')).toBe(true);
  });

  it("the boundary moves with the opponent's Life: 4 Life also offers cost 4, 2 Life drops cost 3", () => {
    const g4 = inHand(4, [C29.c3, C29.c4, C29.c5]);
    playRaw(g4, ID);
    expect(offeredIds(g4)).toEqual([C29.c3, C29.c4].sort());
    const g2 = inHand(2, [C29.c1, C29.c2, C29.c3]);
    playRaw(g2, ID);
    expect(offeredIds(g2)).toEqual([C29.c1, C29.c2].sort());
  });

  it('with 0 opposing Life no Character of cost 1 or more qualifies: nothing can be rested', () => {
    const g = inHand(0, [C29.c1, C29.c2]);
    playRaw(g, ID);
    settleEmpty(g);
    expect(isMain(g, 'p1')).toBe(true);
    expect(g.card(inst(g, 'p2', 'characters', C29.c1)).rested).toBe(false);
    expect(g.card(inst(g, 'p2', 'characters', C29.c2)).rested).toBe(false);
  });

  it('"up to 1": the player may rest nothing', () => {
    const g = inHand(3, [C29.c1]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(inst(g, 'p2', 'characters', C29.c1)).rested).toBe(false);
  });

  it("counts the opponent's Life, not mine", () => {
    const g = mine(
      L29.croc,
      { hand: [ID], life: fill(C29.c1, 5) },
      { life: fill(C29.c1, 1), characters: [C29.c1, C29.c2] },
    );
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c1]);
  });

  it('[When Attacking] works the same way, before the Block Step', () => {
    const g = onBoard(3, [C29.c2, C29.c4]);
    act(g, { type: 'attack', attacker: inst(g, 'p1', 'characters', ID), target: g.leader('p2') });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c2]);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c2)]);
    expect(g.card(inst(g, 'p2', 'characters', C29.c2)).rested).toBe(true);
    expect(kind(g)).toBe('block');
  });

  it('[When Attacking] with 0 opposing Life finds nothing and the attack goes on', () => {
    const g = onBoard(0, [C29.c1]);
    act(g, { type: 'attack', attacker: inst(g, 'p1', 'characters', ID), target: g.leader('p2') });
    settleEmpty(g);
    expect(kind(g)).toBe('block');
    expect(g.card(inst(g, 'p2', 'characters', C29.c1)).rested).toBe(false);
  });

  it('must not rest my own Characters or the opposing Leader', () => {
    const g = mine(
      L29.croc,
      { hand: [ID], characters: [C29.c1] },
      { life: fill(C29.c1, 5), characters: [C29.c2] },
    );
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c2]);
  });
});
