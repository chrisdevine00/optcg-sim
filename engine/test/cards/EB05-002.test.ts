/** EB05-002 Doll. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';
import { orderAll } from './helpers-hancock-rosi.ts';

const ID = 'EB05-002';
/** {Navy} vanillas: Doberman cost 2, Yamakaji cost 3, Komille cost 1. */
const NAVY2 = 'OP02-107';
const NAVY3 = 'OP02-116';
const NAVY1 = 'OP02-097';

const start = (top: string[]) =>
  game(
    {
      leader: PLAIN_PURPLE,
      hand: [ID],
      deck: [...top, BLUE, BLUE, BLUE],
      costArea: { active: 1, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('EB05-002 Doll', () => {
  it('[On Play]: looks at 5, reveals up to 2 {Navy} cards with cost 2 or more into your hand, the rest go to the bottom; then trash 1 card from your hand', () => {
    const g = start([NAVY2, NAVY1, NAVY3, V.c1, V.c2]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', NAVY2), g.find('p1', 'deck', NAVY3)]);
    orderAll(g);
    expect(hand(g, 'p1').sort()).toEqual([NAVY2, NAVY3].sort());
    expect(
      g
        .eventsOfType('CardRevealed')
        .map((e) => e.card)
        .filter((c) => c !== ID)
        .sort(),
    ).toEqual([NAVY2, NAVY3].sort());
    // Then, trash 1 card from your hand: the player chooses which.
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', NAVY3)]);
    expect(hand(g, 'p1')).toEqual([NAVY2]);
    expect(trash(g, 'p1')).toEqual([NAVY3]);
    // The 3 unchosen looked-at cards are at the bottom of the 8-card deck minus the 2 taken.
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    const bottom3 = g
      .zone('p1', 'deck')
      .slice(-3)
      .map((c) => c.card)
      .sort();
    expect(bottom3).toEqual([NAVY1, V.c1, V.c2].sort());
  });

  it('a {Navy} card with cost 1 and non-{Navy} cards are not candidates', () => {
    const g = start([NAVY1, V.c3, NAVY2, V.c4, V.c5]);
    play(g, ID);
    const choices = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(choices).toEqual([g.find('p1', 'deck', NAVY2)]);
    none(g);
  });

  it('"up to 2": taking 1 card is allowed; it is then the one trashed', () => {
    const g = start([NAVY2, NAVY3, V.c1, V.c2, V.c3]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', NAVY3)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([NAVY3]);
    // Only one card in hand: it is trashed (the choice is still asked from a hidden hand).
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'hand', NAVY3)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([NAVY3]);
  });

  it('with nothing taken, the trash still happens ("Then" is not "If you do") and finds an empty hand', () => {
    const g = start([V.c1, V.c2, V.c3, V.c4, V.c5]);
    play(g, ID);
    none(g);
    orderAll(g);
    if (dec(g)?.kind === 'choose') none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });
});
