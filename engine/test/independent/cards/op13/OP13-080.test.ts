/**
 * OP13-080 St. Ethanbaron V. Nusjuro (Character, Black, cost 6, 5000, Counter +1000, {Celestial
 * Dragons}/{Five Elders}).
 *
 * Card text: "If you have 7 or more cards in your trash, this Character cannot be removed from the field by
 * your opponent's effects and gains [Rush]. [When Attacking] If you have 10 or more cards in your
 * trash, give up to 1 of your opponent's Characters −2000 power during this turn."
 *
 * Rules: CR 8-1-? ("cannot be removed from the field" stops the opponent's effects only, QA-OP02
 * OP02-027), CR 10-1-1 ([Rush]), CR 4-8-1 ("up to"), CR 6-6-1-3 ("during this turn"), a battle K.O.
 * is not an effect. The shared static tests come from `describeShield`.
 * Scenery: OP01-023 Marco (5000), OP01-010 Komachiyo (3000).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  ch,
  describeShield,
  junk,
  kind,
  LD13,
  me,
  need,
  noDefence,
  none,
  offeredIds,
  pickInst,
  S13,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-080';

describeShield({ id: ID, rush: true });

/** Nusjuro attacks the opponent's Leader with `n` cards in my trash; p2 has Marco (5000) and Komachiyo (3000). */
function attacking(n: number): TestGame {
  const g = me(LD13.plain, { characters: [ID], trash: junk(n) }, { characters: [S13.c3, S13.c1] });
  attack(g, ch(g, 'p1', ID), g.leader('p2'));
  return g;
}

describe('OP13-080 [When Attacking]: with 10 or more cards in my trash, give up to 1 opposing Character −2000 power', () => {
  it('10 cards: gives −2000 to the chosen opposing Character (5000 becomes 3000)', () => {
    const g = attacking(10);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1, S13.c3].sort());
    pickInst(g, [ch(g, 'p2', S13.c3)]);
    expect(g.power(ch(g, 'p2', S13.c3))).toBe(3000);
    expect(g.power(ch(g, 'p2', S13.c1))).toBe(3000);
    expect(kind(g)).toBe('block');
  });

  it('boundary: 9 cards: nothing is asked and no power changes', () => {
    const g = attacking(9);
    expect(kind(g)).toBe('block');
    expect(g.power(ch(g, 'p2', S13.c3))).toBe(5000);
  });

  it('only the opponent’s Characters are candidates', () => {
    const g = me(
      LD13.plain,
      { characters: [ID, S13.c4], trash: junk(10) },
      { characters: [S13.c3] },
    );
    attack(g, ch(g, 'p1', ID), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c3]);
  });

  it('"up to 1": may choose nobody', () => {
    const g = attacking(10);
    none(g);
    expect(g.power(ch(g, 'p2', S13.c3))).toBe(5000);
    expect(kind(g)).toBe('block');
  });

  it('"during this turn": the −2000 outlasts the battle and ends with my turn', () => {
    const g = attacking(10);
    pickInst(g, [ch(g, 'p2', S13.c3)]);
    noDefence(g);
    expect(atMain(g)).toBe(true);
    expect(g.power(ch(g, 'p2', S13.c3))).toBe(3000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(ch(g, 'p2', S13.c3))).toBe(5000);
  });

  it('fires only when Nusjuro attacks: not when my Leader attacks', () => {
    const g = me(LD13.plain, { characters: [ID], trash: junk(10) }, { characters: [S13.c3] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(kind(g)).toBe('block');
  });
});
