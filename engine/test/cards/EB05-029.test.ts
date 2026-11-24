/** EB05-029 Kimono Sleeve Cage. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { cardsOf, donArea } from './helpers-luffyace.ts';
import { damageWith } from './triggers.ts';

const CAGE = 'EB05-029';
const start = (oppChars: string[]) =>
  game(
    { leader: PLAIN_BLUE, hand: [CAGE, PURPLE], ...donArea(5) },
    { leader: PLAIN_BLUE, characters: oppChars },
  );

describe('EB05-029 Kimono Sleeve Cage', () => {
  it("[Main] may trash 1 card: an opposing Character with cost 6 or less returns to its owner's hand", () => {
    const g = start([V.c6, V.c1]);
    play(g, CAGE);
    accept(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(trash(g, 'p1')).toContain(PURPLE);
    expect(hand(g, 'p2')).toEqual([V.c6]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c1]);
    expectDecision(g, 'main', 'p1');
  });

  it('a Character with cost 7 or more cannot be chosen', () => {
    const g = start([V.c7]);
    play(g, CAGE);
    accept(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('declining the cost: the Event is spent, nothing is trashed or returned', () => {
    const g = start([V.c6]);
    play(g, CAGE);
    decline(g);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('"up to 1": the target may be skipped (the cost is still paid)', () => {
    const g = start([V.c6]);
    play(g, CAGE);
    accept(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    g.act({ type: 'done' });
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6]);
    expect(trash(g, 'p1')).toContain(PURPLE);
  });

  it('[Trigger] draws 2 cards and trashes 1 card from hand', () => {
    const g = damageWith(CAGE, { leader: PLAIN_BLUE, hand: [PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});
