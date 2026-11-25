/** OP09-059 Murder at the Steam Bath (Event, cost 2). */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  counterStep,
  damageGame,
  dec,
  expectDecision,
  hand,
  idsOf,
  none,
  OTHER_LEADER,
  pick,
  trash,
  useCounter,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-059';

describe('OP09-059 Murder at the Steam Bath: [Counter]', () => {
  const DECK = [V.c1, V.c2, V.c3, V.c4, V.c5];
  const start = (handCards: string[], deck = DECK) =>
    counterStep({
      leader: OTHER_LEADER,
      hand: [ID, ...handCards],
      deck,
      costArea: { active: 3, rested: 0 },
    });
  /** Use the Event and give the +3000 to the Leader; the hand choice is open. */
  const use = (g: ReturnType<typeof start>) => {
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
  };

  it('+3000 power during this battle, then trash 2 cards from your hand and the same number from the top of your deck', () => {
    const g = start([V.c6, V.c7, V.c2]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c6), g.find('p1', 'hand', V.c7)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c3, V.c4, V.c5]); // 2 from the top (c1, c2)
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c6, V.c7, V.c1, V.c2].sort());
    expectDecision(g, 'counter', 'p1');
  });

  it('trashing 1 card from your hand trashes 1 from your deck', () => {
    const g = start([V.c6, V.c7]);
    use(g);
    pick(g, [g.find('p1', 'hand', V.c7)]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c2, V.c3, V.c4, V.c5]);
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c7, V.c1].sort());
  });

  it('"up to 2": trashing nothing trashes nothing from the deck', () => {
    const g = start([V.c6]);
    use(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([V.c6]);
    expect(idsOf(g, 'p1', 'deck')).toEqual(DECK);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('at most 2 cards: a third cannot be chosen', () => {
    const g = start([V.c6, V.c7, V.c2]);
    use(g);
    pick(g, [g.find('p1', 'hand', V.c6), g.find('p1', 'hand', V.c7)]);
    expect(dec(g)?.kind).toBe('counter'); // the choice closed after 2
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('a deck with fewer cards trashes as many as it holds', () => {
    const g = start([V.c6, V.c7], [V.c1]);
    use(g);
    pick(g, [g.find('p1', 'hand', V.c6), g.find('p1', 'hand', V.c7)]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c6, V.c7, V.c1].sort());
  });

  it('with an empty hand nothing is trashed from the deck', () => {
    const g = start([]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(idsOf(g, 'p1', 'deck')).toEqual(DECK);
    expect(dec(g)?.kind).toBe('counter');
  });

  it('"Then" is not "If you do": the hand trash is offered even when nobody got the +3000', () => {
    const g = start([V.c6]);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', V.c6))).toBe(true);
  });
});

describe('OP09-059 Murder at the Steam Bath: [Trigger]', () => {
  it('draws 1 card', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER, deck: [V.c2, V.c3] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });
});
