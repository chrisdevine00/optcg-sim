/** EB02-056 Vegapunk. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, none, pick, play, PURPLE } from './helpers.ts';
import {
  canPick,
  ids,
  mk,
  orderAll,
  SCI5,
  SCI5B,
  SCI6,
  trigGame,
  V,
  VEGAPUNK2,
} from './helpers-aeb2g2.ts';

const ID = 'EB02-056';
// Top 5: cost 1 vanilla, Scientist 5, Scientist 6, [Vegapunk], Scientist 5 (another). The 6th is not looked at.
const DECK = [V.c1, SCI5, SCI6, VEGAPUNK2, SCI5B, SCI5];
const start = (p2chars: string[] = [V.c1, V.c2, V.c3], handCards: string[] = [BLUE]) => {
  const g = mk({ hand: [ID, ...handCards], deck: DECK }, { characters: p2chars });
  play(g, ID);
  return g;
};

describe('EB02-056 Vegapunk', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] looks at 5 and plays a {Scientist} Character with cost 5 or less other than [Vegapunk]; the rest go to the bottom', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    // Offered: the two cost 5 Scientists in the top 5; not cost 6, not [Vegapunk], not the vanilla, not the 6th card.
    expect(canPick(g, g.find('p1', 'deck', SCI5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SCI5B))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SCI6))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', VEGAPUNK2))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', SCI5B)]);
    orderAll(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, SCI5B]);
    const deck = ids(g, 'p1', 'deck');
    expect(deck[0]).toBe(SCI5);
    expect(deck.slice(1).sort()).toEqual([V.c1, SCI5, SCI6, VEGAPUNK2].sort());
  });

  it('"up to 1": may play nothing; all 5 cards go to the bottom', () => {
    const g = start();
    none(g);
    orderAll(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'deck')).toHaveLength(6);
    expect(ids(g, 'p1', 'deck')[0]).toBe(SCI5);
  });

  it('with 2 opposing Characters (boundary) you trash 1 card from your hand', () => {
    const g = start([V.c1, V.c2], [BLUE, PURPLE]);
    none(g);
    orderAll(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(ids(g, 'p1', 'trash')).toEqual([PURPLE]);
  });

  it('the hand trash also applies with no opposing Characters, and does not depend on a Character having been played', () => {
    const g = start([], [BLUE]);
    pick(g, [g.find('p1', 'deck', SCI5)]);
    orderAll(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, SCI5]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('must not trash with 3 opposing Characters: no hand choice is asked', () => {
    const g = start([V.c1, V.c2, V.c3], [BLUE, PURPLE]);
    none(g);
    orderAll(g);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([BLUE, PURPLE]);
  });

  it('[Trigger] draws 1 card', () => {
    const g = trigGame(ID, { deck: [V.c6, V.c7] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c6]);
  });
});
