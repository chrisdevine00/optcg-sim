/** EB02-045 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  expectDecision,
  hand,
  option,
  pick,
  play,
  PURPLE,
} from './helpers.ts';
import { ids, mk, orderAll, V } from './helpers-aeb2g2.ts';

const ID = 'EB02-045';
const TRASH = [V.c1, V.c2, V.c3];
const start = (p1: Parameters<typeof mk>[0] = {}, p2: Parameters<typeof mk>[1] = {}) => {
  const g = mk({ hand: [ID], trash: TRASH, deck: [V.c6, V.c7, PURPLE], ...p1 }, p2);
  play(g, ID);
  return g;
};
/** Pay the cost with the two trash cards c1 and c2, ordering them, and stop at the mode choice. */
const pay = (g: ReturnType<typeof start>) => {
  accept(g);
  pick(g, [g.find('p1', 'trash', V.c1), g.find('p1', 'trash', V.c2)]);
  orderAll(g);
};

describe('EB02-045 Trafalgar Law', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] pays 2 trash cards to the bottom of the deck, then draws 1 (mode 1)', () => {
    const g = start();
    pay(g);
    expectDecision(g, 'choose', 'p1');
    option(g, (dec(g)!.options ?? [])[0]!.id);
    expect(hand(g, 'p1')).toEqual([V.c6]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c3]);
    expect(ids(g, 'p1', 'deck').slice(-2).sort()).toEqual([V.c1, V.c2].sort());
    expect(ids(g, 'p1', 'deck')).toHaveLength(4);
  });

  it('mode 2: with 5 cards in the opponent hand they trash 1 of their choice', () => {
    const g = start({}, { hand: [BLUE, PURPLE, V.c1, V.c2, V.c3] });
    pay(g);
    option(g, (dec(g)!.options ?? [])[1]!.id);
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', V.c2)]);
    expect(ids(g, 'p2', 'hand')).toHaveLength(4);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('mode 2 with 4 cards in the opponent hand (boundary) does nothing: nothing is asked or trashed', () => {
    const g = start({}, { hand: [BLUE, PURPLE, V.c1, V.c2] });
    pay(g);
    option(g, (dec(g)!.options ?? [])[1]!.id);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p2', 'hand')).toHaveLength(4);
    expect(ids(g, 'p2', 'trash')).toEqual([]);
  });

  it('"You may": declining leaves the trash and the deck as they were and asks no mode', () => {
    const g = start();
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'trash')).toEqual(TRASH);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('must not fire with fewer than 2 cards in the trash (the cost cannot be paid): no offer', () => {
    const g = start({ trash: [V.c1] });
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'trash')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
