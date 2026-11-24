/** EB04-026 Bluegrass. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash } from './helpers.ts';
import {
  at,
  attack,
  BLUE,
  canPick,
  cardsOf,
  finishBattle,
  mk,
  MINK1,
  PURPLE,
  RED_LEADER,
  V,
} from './helpers-eb04g1.ts';

const ID = 'EB04-026';

describe('EB04-026 Bluegrass', () => {
  it("[On Play]: places up to 1 opposing Character of cost 1 or less at the bottom of its owner's deck", () => {
    const g = mk(
      { leader: RED_LEADER, hand: [ID] },
      { characters: [V.c1, V.c2], deck: [PURPLE, BLUE] },
    );
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, at(g, 'p2', 'characters', V.c1))).toBe(true); // cost 1: boundary
    expect(canPick(g, at(g, 'p2', 'characters', V.c2))).toBe(false); // cost 2
    pick(g, [at(g, 'p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2]);
    expect(cardsOf(g, 'p2', 'deck')).toEqual([PURPLE, BLUE, V.c1]);
  });

  it('"up to 1": may be skipped; your own Characters are never offered', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], characters: [MINK1] }, { characters: [V.c1] });
    play(g, ID);
    expect(canPick(g, at(g, 'p1', 'characters', MINK1))).toBe(false);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('with no opposing Character of cost 1 or less nothing is asked', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID] }, { characters: [V.c3] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
  });

  it('[When Attacking]: draws 1 card, then trashes 1 card from your hand (mandatory)', () => {
    const g = mk(
      { leader: RED_LEADER, hand: [V.c2], characters: [ID], deck: [V.c4, V.c5] },
      { characters: [V.c5] },
    );
    attack(g, at(g, 'p1', 'characters', ID));
    expect(hand(g, 'p1')).toEqual([V.c2, V.c4]);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    finishBattle(g);
  });

  it('it can trash the card it just drew', () => {
    const g = mk({ leader: RED_LEADER, hand: [], characters: [ID], deck: [V.c4, V.c5] });
    attack(g, at(g, 'p1', 'characters', ID));
    // The only card in hand is the drawn one: it is trashed (a single choice).
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([V.c4]);
    finishBattle(g);
  });

  it('[When Attacking] is not an [On Play]: playing it draws nothing', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], deck: [V.c4] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
