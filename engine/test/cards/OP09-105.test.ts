/** OP09-105 Sanji. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  EGG_LEADER,
  expectDecision,
  handIds,
  hitWith,
  idsOf,
  OTHER_LEADER,
  pick,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-105';

/** Answer every remaining pick with the first legal one. */
const drain = (g: ReturnType<typeof hitWith>) => {
  while (g.legal().some((a) => a.type === 'pick')) g.act(g.legal().find((a) => a.type === 'pick')!);
};

describe('OP09-105 Sanji [Trigger]', () => {
  it('with an {Egghead} Leader: add the top card of the deck to the top of Life, then trash 2 cards from hand', () => {
    const g = hitWith(ID, EGG_LEADER, { hand: [V.c2, V.c3, V.c4], deck: [V.c5, V.c6] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'optional', 'p1'); // "up to 1" card from the deck top
    accept(g);
    // Life: the Sanji card was taken as damage (1 left), the deck card goes on top, face-down.
    expect(idsOf(g, 'p1', 'life')).toEqual([V.c5, V.c1]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBeFalsy();
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c6]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c3)]);
    expect(handIds(g, 'p1')).toEqual([V.c4]);
    expect(idsOf(g, 'p1', 'trash')).toEqual(expect.arrayContaining([V.c2, V.c3, ID]));
  });

  it('"up to 1": declining the Life card still trashes 2 cards ("Then" follows the If)', () => {
    const g = hitWith(ID, EGG_LEADER, { hand: [V.c2, V.c3, V.c4], deck: [V.c5, V.c6] });
    g.act({ type: 'trigger', activate: true });
    decline(g);
    expect(idsOf(g, 'p1', 'life')).toEqual([V.c1]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c5, V.c6]);
    pick(g, [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c3)]);
    expect(handIds(g, 'p1')).toEqual([V.c4]);
  });

  it('with fewer than 2 cards in hand, all of them are trashed', () => {
    const g = hitWith(ID, EGG_LEADER, { hand: [V.c2], deck: [V.c5, V.c6] });
    g.act({ type: 'trigger', activate: true });
    accept(g);
    drain(g);
    expect(handIds(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toEqual(expect.arrayContaining([V.c2, ID]));
  });

  it('with an empty deck nothing is added to Life but the 2 cards are still trashed', () => {
    const g = hitWith(ID, EGG_LEADER, { hand: [V.c2, V.c3], deck: [] });
    g.act({ type: 'trigger', activate: true });
    if (dec(g)?.kind === 'optional') decline(g);
    drain(g);
    expect(g.life('p1')).toBe(1);
    expect(handIds(g, 'p1')).toEqual([]);
  });

  it('must not do anything without an {Egghead} Leader: no Life card, no trash', () => {
    const g = hitWith(ID, OTHER_LEADER, { hand: [V.c2, V.c3, V.c4], deck: [V.c5, V.c6] });
    g.act({ type: 'trigger', activate: true });
    expect(dec(g)?.kind).toBe('main');
    expect(idsOf(g, 'p1', 'life')).toEqual([V.c1]);
    expect(handIds(g, 'p1')).toEqual([V.c2, V.c3, V.c4]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c5, V.c6]);
  });

  it('declining the [Trigger] adds Sanji to the hand', () => {
    const g = hitWith(ID, EGG_LEADER, { hand: [V.c2], deck: [V.c5] });
    g.act({ type: 'trigger', activate: false });
    expect(handIds(g, 'p1')).toEqual([V.c2, ID]);
    expect(g.life('p1')).toBe(1);
  });
});
