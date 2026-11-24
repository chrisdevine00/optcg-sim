/** EB04-037 Porche: [On Play] with a {Foxy Pirates} Leader, look at 5; reveal up to 1 {Foxy Pirates} card, add it to your hand, the rest to the bottom in any order. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, FOXY1, FOXY4, FOXY_LEADER, ids, mine, OTHER_LEADER } from './helpers-eb04g2.ts';

const ID = 'EB04-037';
const FILL = Array(5).fill(V.c7) as string[];

const setup = (leader: string, top: string[]) =>
  mine({ leader, hand: [ID], deck: [...top, ...FILL] });
/** Place the remaining looked cards at the bottom in the order offered first. */
const settle = (g: ReturnType<typeof setup>) => {
  while (dec(g)?.kind === 'order') g.act(g.legal()[0]!);
};

describe('EB04-037 Porche', () => {
  it('with a {Foxy Pirates} Leader: add 1 {Foxy Pirates} card of the top 5; the other four go to the bottom', () => {
    const g = setup(FOXY_LEADER, [V.c1, FOXY4, V.c2, V.c3, V.c4]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', FOXY4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', FOXY4)]);
    settle(g);
    expect(ids(g, 'p1', 'hand')).toEqual([FOXY4]);
    const deck = ids(g, 'p1', 'deck');
    expect(deck).toHaveLength(9);
    expect(deck.slice(0, 5)).toEqual(FILL);
    expect(deck.slice(5).sort()).toEqual([V.c1, V.c2, V.c3, V.c4].sort());
  });

  it('"up to 1": taking nothing puts all five at the bottom', () => {
    const g = setup(FOXY_LEADER, [FOXY4, FOXY1, V.c2, V.c3, V.c4]);
    play(g, ID);
    none(g);
    settle(g);
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(ids(g, 'p1', 'deck').slice(0, 5)).toEqual(FILL);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('only the top 5 are looked at: a {Foxy Pirates} card 6th from the top is not offered', () => {
    const g = setup(FOXY_LEADER, [V.c1, V.c2, V.c3, V.c4, V.c5, FOXY4]);
    play(g, ID);
    // No {Foxy Pirates} card among the five: the pick is asked with nothing selectable, or not asked.
    if (dec(g)?.kind === 'choose') {
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
      none(g);
    }
    settle(g);
    expect(ids(g, 'p1', 'hand')).toEqual([]);
  });

  it('without a {Foxy Pirates} Leader nothing is looked at', () => {
    const g = setup(OTHER_LEADER, [FOXY4, V.c1, V.c2, V.c3, V.c4]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'deck').slice(0, 5)).toEqual([FOXY4, V.c1, V.c2, V.c3, V.c4]);
    expect(ids(g, 'p1', 'hand')).toEqual([]);
  });

  it('any {Foxy Pirates} card qualifies, not only Characters named Porche', () => {
    const g = setup(FOXY_LEADER, [FOXY1, FOXY4, V.c2, V.c3, V.c4]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', FOXY1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', FOXY4))).toBe(true);
    pick(g, [g.find('p1', 'deck', FOXY1)]);
    settle(g);
    expect(ids(g, 'p1', 'hand')).toEqual([FOXY1]);
  });
});
