/**
 * OP16-R3 / disagreement B-1: "place N cards from your hand/trash at the bottom of your deck in any
 * order" gives the owner the order decision, hidden from the other player. Planted on OP16-047
 * (effect `move` from a hand) and OP17-095 (a cost `move` from a trash). Each test fails with the
 * engine change reverted (no order decision, canonical order).
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents } from '../../../src/index.ts';
import { applyOp } from '../../../src/testing.ts';
import {
  accept,
  BLUE,
  expectDecision,
  game,
  hand,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from '../helpers.ts';
import { BLUE_LEADER, IMPEL_LEADER } from '../helpers-op16g2.ts';

type G = ReturnType<typeof game>;
const names = (g: G, p: 'p1' | 'p2', n: number) =>
  g
    .zone(p, 'deck')
    .slice(-n)
    .map((c) => c.card);
const answer = (g: G, card: string) => {
  const a = g.legal().find((x) => x.type === 'order' && g.card(x.first).card === card);
  g.act(a!);
};

/** OP16-047: the opponent (p2) holds eight cards and places V.c1 and V.c2. */
const doflamingo = () => {
  const g = game(
    { leader: IMPEL_LEADER, characters: ['OP16-047'] },
    { leader: BLUE_LEADER, hand: [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, V.c7, PURPLE], deck: [BLUE] },
  );
  g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP16-047'), ability: 'activate' });
  pick(g, [g.find('p2', 'hand', V.c1), g.find('p2', 'hand', V.c2)]);
  return g;
};

describe('hand to the deck bottom: the owner orders (OP16-047)', () => {
  it('the owner (p2), not the player who used the card, is asked, with both cards offered', () => {
    const g = doflamingo();
    const d = expectDecision(g, 'order', 'p2');
    expect(d.options).toHaveLength(2);
    // Nothing has moved yet.
    expect(hand(g, 'p2')).toHaveLength(8);
  });

  it('the first named card ends up above the second, whichever it is', () => {
    const a = doflamingo();
    answer(a, V.c1);
    expect(names(a, 'p2', 2)).toEqual([V.c1, V.c2]);
    const b = doflamingo();
    answer(b, V.c2);
    expect(names(b, 'p2', 2)).toEqual([V.c2, V.c1]);
    expect(hand(b, 'p2')).toHaveLength(6);
    expectDecision(b, 'main', 'p1');
  });

  it('p1 cannot learn the order or the cards: events and views are identical for both answers', () => {
    const a = doflamingo();
    const b = doflamingo();
    const fa = a.events.length;
    const fb = b.events.length;
    answer(a, V.c1);
    answer(b, V.c2);
    const seen = (g: G, from: number) => JSON.stringify(projectEvents(g.events.slice(from), 'p1'));
    expect(seen(a, fa)).toBe(seen(b, fb));
    // The cards that went from a hand are not named to p1 (a hand card is not revealed).
    for (const c of [V.c1, V.c2]) expect(seen(a, fa)).not.toContain(c);
    expect(JSON.stringify(project(a.state, 'p1'))).toBe(JSON.stringify(project(b.state, 'p1')));
    // The pending order decision names the hand cards to p2 only.
    const mid = doflamingo();
    expect(JSON.stringify(project(mid.state, 'p1').decision ?? null)).not.toContain(V.c1);
    expect(JSON.stringify(project(mid.state, 'p2').decision)).toContain('"label"');
  });
});

describe('trash to the deck bottom as a cost: the owner orders (OP17-095)', () => {
  const zoro = (trashCards: string[]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: ['OP17-095', V.c4], trash: trashCards },
      { leader: PLAIN_BLUE },
    );
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', V.c4),
      by: 'p2',
    }).state;
    accept(g);
    return g;
  };

  it('three cards need an order: asked until one is left, and the answers fix the bottom', () => {
    const run = (first: string, second: string) => {
      const g = zoro([V.c1, V.c2, V.c3]);
      expectDecision(g, 'order', 'p1');
      answer(g, first);
      expectDecision(g, 'order', 'p1');
      answer(g, second);
      expectDecision(g, 'main', 'p1');
      return names(g, 'p1', 3);
    };
    expect(run(V.c3, V.c1)).toEqual([V.c3, V.c1, V.c2]);
    expect(run(V.c2, V.c3)).toEqual([V.c2, V.c3, V.c1]);
  });

  it('events for p2 are the same whatever the order', () => {
    const play = (first: string) => {
      const g = zoro([V.c1, V.c2, V.c3]);
      const from = g.events.length;
      answer(g, first);
      answer(g, first === V.c3 ? V.c1 : V.c3);
      return JSON.stringify(projectEvents(g.events.slice(from), 'p2'));
    };
    expect(play(V.c3)).toBe(play(V.c1));
  });
});
