/**
 * ST25-001 Alvida (Character, Blue, cost 4, 5000, Counter +1000, {Cross Guild}).
 *
 * Card text:
 *   If you have 2 or more Characters with a base cost of 5 or more, this Character gains +1 cost.
 *   [On Play] If your Leader is [Buggy], draw 3 cards and trash 2 cards from your hand.
 */
import { describe, expect, it } from 'vitest';
import { atMain, BLUE, deck, hand, mine, need, trash } from '../op17/kit-op17b.ts';
import { choose } from '../kit.ts';
import { handInstances, inst, LC, playRaw, SCL } from './kit-lfc.ts';

const ALVIDA = 'ST25-001';

function onField(chars: (string | { card: string; rested?: boolean })[], p2chars: string[] = []) {
  return mine(LC.plain, { characters: chars }, { characters: p2chars });
}

function costOf(g: ReturnType<typeof onField>, card = ALVIDA) {
  return g.card(inst(g, 'p1', 'characters', card)).cost;
}

describe('ST25-001 Alvida: +1 cost with 2+ Characters of base cost 5+; [On Play] with Leader [Buggy], draw 3 and trash 2', () => {
  it('with two Characters of base cost 5 or more it costs 5', () => {
    const g = onField([ALVIDA, SCL.c5, SCL.cg5]);
    expect(costOf(g)).toBe(5);
  });

  it('with only one such Character it keeps its printed cost of 4', () => {
    const g = onField([ALVIDA, SCL.c5, SCL.c4]);
    expect(costOf(g)).toBe(4);
  });

  it('base cost 5 or more: a cost 6 Character counts, and rested Characters count too', () => {
    const g = onField([ALVIDA, { card: SCL.c6, rested: true }, { card: SCL.c8, rested: true }]);
    expect(costOf(g)).toBe(5);
  });

  it('Characters of base cost 4 do not count (boundary), however many there are', () => {
    const g = onField([ALVIDA, SCL.c4, SCL.c4, SCL.c4, SCL.c5]);
    expect(costOf(g)).toBe(4);
  });

  it('copies of itself do not bootstrap the condition: 4-cost Alvidas next to one 5-cost Character stay at 4', () => {
    const g = onField([ALVIDA, ALVIDA, ALVIDA, SCL.c5]);
    expect(costOf(g)).toBe(4);
  });

  it('only my Characters count: two cost 5+ Characters on the opponent side give no bonus', () => {
    const g = onField([ALVIDA], [SCL.c5, SCL.c6]);
    expect(costOf(g)).toBe(4);
  });

  it('with no Characters of cost 5+ (only itself) it stays at 4', () => {
    const g = onField([ALVIDA]);
    expect(costOf(g)).toBe(4);
  });

  it('[On Play] with Leader [Buggy]: draws 3 then trashes exactly 2 of the hand cards (the drawn ones may be chosen)', () => {
    const g = mine(LC.buggy, {
      hand: [ALVIDA, SCL.c2, SCL.c3],
      deck: [BLUE, BLUE, BLUE, BLUE, BLUE],
      costArea: { active: 4, rested: 0 },
    });
    const before = handInstances(g);
    playRaw(g, ALVIDA);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(5);
    const drawn = handInstances(g).filter((i) => !before.includes(i));
    expect(drawn).toHaveLength(3);
    choose(g, [inst(g, 'p1', 'hand', SCL.c2), drawn[0]!]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCL.c3, BLUE, BLUE].sort());
    expect(trash(g)).toEqual([BLUE, SCL.c2].sort());
    expect(deck(g)).toHaveLength(2);
  });

  it('[On Play] with a Leader that is not [Buggy]: nothing is drawn or trashed, and no prompt appears', () => {
    const g = mine(LC.plain, {
      hand: [ALVIDA, SCL.c2, SCL.c3],
      deck: [BLUE, BLUE, BLUE, BLUE, BLUE],
      costArea: { active: 4, rested: 0 },
    });
    playRaw(g, ALVIDA);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCL.c2, SCL.c3].sort());
    expect(deck(g)).toHaveLength(5);
    expect(trash(g)).toEqual([]);
  });

  it('the Leader must be [Buggy] by name: a Character named Buggy elsewhere is not enough', () => {
    const g = mine(LC.plain, {
      hand: [ALVIDA, SCL.c2],
      characters: [SCL.cg6],
      deck: [BLUE, BLUE, BLUE, BLUE],
      costArea: { active: 4, rested: 0 },
    });
    playRaw(g, ALVIDA);
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(4);
  });
});
