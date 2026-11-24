/**
 * M6b wave 4, G31: `lookAtTop` at the opponent's deck, look only (`rest: 'stay'`, nothing taken,
 * nothing moves), and `rest: 'topAnyOrder'` (put them all back on top in an order you choose).
 * Planted on vanilla cards; each test fails with the gap reverted. The other player learns that a
 * look happened and nothing of the cards (two-position projection tests).
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents, type ProjectedView } from '@optcg/engine';
import { withAbilities } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const look = (spec: object) => ({ do: { lookAtTop: spec } });
const lookOpp = (n = 1) => look({ n, player: 'opponent', take: [], rest: 'stay' });
const raw = (effect: unknown[]) => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  effect,
});

const mk = (effect: unknown[], oppDeck: string[] = [V.c3, V.c4, V.c5, PURPLE], mine?: string[]) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE], ...(mine ? { deck: mine } : {}) },
    { leader: PLAIN_BLUE, deck: oppDeck },
  );
  g.state = withAbilities(g.state, BLUE, [main(effect as never)]);
  return g;
};
/** What `viewer` remembers of hidden cards, by position (`p2.deck.0`): the projection's `known`. */
const known = (g: ReturnType<typeof mk>, viewer: 'p1' | 'p2'): Record<string, string> =>
  (project(g.state, viewer) as unknown as ProjectedView).known;
const deckOf = (g: ReturnType<typeof mk>, p: 'p1' | 'p2') => g.zone(p, 'deck').map((c) => c.card);

describe('G31 look at the opponent’s deck', () => {
  it('validates: look only, nothing taken, rest "stay"', () => {
    expectValid([main([lookOpp(1)] as never)]);
    expect(
      errorsOf(raw([look({ n: 1, player: 'opponent', take: [], rest: 'trash' })])),
    ).not.toEqual([]);
    expect(
      errorsOf(
        raw([
          look({
            n: 1,
            player: 'opponent',
            take: [{ pick: { upTo: 1 }, to: 'hand' }],
            rest: 'stay',
          }),
        ]),
      ),
    ).not.toEqual([]);
    // "stay" with a take is refused for your own deck too.
    expect(
      errorsOf(raw([look({ n: 2, take: [{ pick: { upTo: 1 }, to: 'hand' }], rest: 'stay' })])),
    ).not.toEqual([]);
    expect(errorsOf(raw([look({ n: 1, player: 'me', take: [], rest: 'stay' })]))).not.toEqual([]);
  });

  it('shows you the top card, moves nothing and asks nothing', () => {
    const g = mk([lookOpp(1)]);
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(deckOf(g, 'p2')).toEqual([V.c3, V.c4, V.c5, PURPLE]);
    expect(g.events.filter((e) => e.type === 'CardsLooked')).toHaveLength(1);
    // The looker remembers the top card of the opponent's deck; the opponent's view has no such mark.
    expect(known(g, 'p1')['p2.deck.0']).toBe(V.c3);
    expect(known(g, 'p2')['p2.deck.0']).toBeUndefined();
  });

  it('looks at as many as asked: the top 3', () => {
    const g = mk([lookOpp(3)]);
    run(g);
    const kn = known(g, 'p1');
    expect([kn['p2.deck.0'], kn['p2.deck.1'], kn['p2.deck.2']]).toEqual([V.c3, V.c4, V.c5]);
    expect(kn['p2.deck.3']).toBeUndefined();
  });

  it('forgets the card once it moves: the opponent draws it', () => {
    const g = mk([lookOpp(1)]);
    run(g);
    expect(known(g, 'p1')['p2.deck.0']).toBe(V.c3);
    g.act({ type: 'endTurn' });
    // p2's turn: the Draw Phase takes the card the looker had seen.
    expect(deckOf(g, 'p2')[0]).toBe(V.c4);
    expect(Object.values(known(g, 'p1'))).not.toContain(V.c3);
  });

  it('the opponent learns that a look happened, never what was on top', () => {
    const play = (top: string) => {
      const g = mk([lookOpp(1)], [top, V.c4, V.c5, PURPLE]);
      run(g);
      return g;
    };
    const a = play(V.c3);
    const b = play(V.c6);
    const seen = (g: ReturnType<typeof mk>, who: 'p1' | 'p2') =>
      JSON.stringify([project(g.state, who), projectEvents(g.events, who)]);
    expect(seen(a, 'p2')).toBe(seen(b, 'p2'));
    // The looker does see the difference (the control: the test can tell the positions apart).
    expect(seen(a, 'p1')).not.toBe(seen(b, 'p1'));
    expect(JSON.stringify(projectEvents(a.events, 'p2'))).not.toContain(V.c3);
  });

  it('whether a prompt is asked never depends on the opponent’s deck', () => {
    // A look asks nothing, so the decision after it is `main` whatever the deck holds.
    for (const top of [V.c3, PURPLE]) {
      const g = mk([lookOpp(1)], [top, V.c4]);
      run(g);
      expectDecision(g, 'main', 'p1');
    }
  });
});

describe('G31 topAnyOrder', () => {
  const mine = [V.c2, V.c3, V.c4, V.c5, V.c6];
  const topAny = (n: number) => look({ n, take: [], rest: 'topAnyOrder' });

  it('validates for your own deck, with or without a take', () => {
    expectValid([main([topAny(3)] as never)]);
    expectValid([
      main([
        look({ n: 3, take: [{ pick: { upTo: 1 }, to: 'hand' }], rest: 'topAnyOrder' }),
      ] as never),
    ]);
    expect(
      errorsOf(raw([look({ n: 3, player: 'opponent', take: [], rest: 'topAnyOrder' })])),
    ).not.toEqual([]);
  });

  it('puts the cards back on top in the order chosen, with no top-or-bottom question', () => {
    const g = mk([topAny(3)], undefined, mine);
    run(g);
    // The order decision comes first: "choose the next card from the top of your deck".
    const d = expectDecision(g, 'order', 'p1');
    expect(d.prompt).toMatch(/top of your deck/);
    g.act({ type: 'order', first: g.find('p1', 'deck', V.c4) });
    g.act({ type: 'order', first: g.find('p1', 'deck', V.c2) });
    expect(deckOf(g, 'p1')).toEqual([V.c4, V.c2, V.c3, V.c5, V.c6]);
    expectDecision(g, 'main', 'p1');
  });

  it('a single card is simply put back; the deck is unchanged', () => {
    const g = mk([topAny(1)], undefined, mine);
    run(g);
    expectDecision(g, 'main', 'p1');
    expect(deckOf(g, 'p1')).toEqual(mine);
  });

  it('what you saw you still know, and the opponent is not told the order', () => {
    const play = (second: string) => {
      const g = mk([topAny(3)], undefined, [V.c2, second, V.c4, V.c5, V.c6]);
      run(g);
      g.act({ type: 'order', first: g.find('p1', 'deck', second) });
      g.act({ type: 'order', first: g.find('p1', 'deck', V.c2) });
      return g;
    };
    const a = play(V.c3);
    const b = play(V.c7);
    const seen = (g: ReturnType<typeof mk>, who: 'p1' | 'p2') =>
      JSON.stringify([project(g.state, who), projectEvents(g.events, who)]);
    expect(seen(a, 'p2')).toBe(seen(b, 'p2'));
    expect(known(a, 'p1')['p1.deck.0']).toBe(V.c3);
  });
});
