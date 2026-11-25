/**
 * M6b wave 5, G44: "Choose a cost and reveal 1 card from the top of your opponent's deck. If the
 * revealed card has the chosen cost, ..." (OP11-066, 071, 073, 074, 079, 081). A number decision
 * (`chooseNumber`), the opponent's deck top shown to both players (`reveal` with `player`), and the
 * number read back (`{ chosen }`). Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents, type ProjectedView } from '@optcg/engine';
import { withAbilities } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  hand,
  option,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  times,
  V,
} from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const choose = { do: { chooseNumber: { min: 0, max: 10, bind: 'c' } } };
const reveal = { do: { reveal: { from: 'deckTop', n: 1, bind: 'r', player: 'opponent' } } };
const hasCost = {
  ref: 'r',
  matches: { baseCost: { eq: { chosen: 'c' } } },
};
const koIf = {
  if: hasCost,
  then: [
    {
      do: {
        ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
      },
    },
  ],
};
const effect = [choose, reveal, koIf];

/** p2's deck top is `top` (V.c3 has cost 3); p2 has one Character. */
const mk = (top: string = V.c3, deck: string[] = [top, ...times(9, PURPLE)]) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE] },
    { leader: PLAIN_BLUE, characters: [PURPLE], deck },
  );
  g.state = withAbilities(g.state, BLUE, [main(effect as never)]);
  return g;
};
/** What `viewer` remembers of hidden cards, by position (`p2.deck.0`): the projection's `known`. */
const known = (g: ReturnType<typeof mk>, viewer: 'p1' | 'p2'): Record<string, string> =>
  (project(g.state, viewer) as unknown as ProjectedView).known;
const answer = (g: ReturnType<typeof mk>, n: number) => {
  run(g);
  option(g, String(n));
  // "up to 1" K.O.: pick the Character if the condition held.
  if (dec(g)?.kind === 'choose')
    g.act({ type: 'pick', choice: g.find('p2', 'characters', PURPLE) });
};

describe('G44 choose a cost, reveal the opponent’s deck top, compare', () => {
  it('validates, and refuses the nonsense', () => {
    main(effect as never);
    const bad = (e: unknown[]) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: e });
    // `chosen` with no chooseNumber before it.
    expect(bad([reveal, koIf])).not.toEqual([]);
    // The range is 0 to 10.
    for (const r of [
      { min: -1, max: 10 },
      { min: 0, max: 11 },
      { min: 5, max: 4 },
    ])
      expect(bad([{ do: { chooseNumber: { ...r, bind: 'c' } } }])).not.toEqual([]);
    // Only the opponent's deck top is revealed, never their Life.
    expect(
      bad([{ do: { reveal: { from: 'lifeTop', n: 1, bind: 'r', player: 'opponent' } } }]),
    ).not.toEqual([]);
    expect(
      bad([{ do: { reveal: { from: 'deckTop', n: 1, bind: 'r', player: 'you' } } }]),
    ).not.toEqual([]);
    // A name is bound once.
    expect(bad([choose, choose])).not.toEqual([]);
  });

  it('asks for a cost, 0 to 10, and tells both players the number', () => {
    const g = mk();
    run(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(Array.from({ length: 11 }, (_, i) => String(i)));
    option(g, '7');
    const ev = g.eventsOfType('ModeChosen')[0]!;
    expect(ev).toMatchObject({ mode: 7, player: 'p1' });
    for (const viewer of ['p1', 'p2'] as const)
      expect(JSON.stringify(projectEvents(g.events, viewer))).toContain('Chose 7');
  });

  it('a match runs the effect; a miss does not; the card stays on top of the deck', () => {
    const hit = mk(V.c3);
    answer(hit, 3);
    expect(hit.zone('p2', 'characters')).toHaveLength(0);
    expect(hit.zone('p2', 'deck')[0]!.card).toBe(V.c3);

    const miss = mk(V.c3);
    answer(miss, 4);
    expect(miss.zone('p2', 'characters')).toHaveLength(1);
    expect(miss.zone('p2', 'deck')[0]!.card).toBe(V.c3);
    // Nothing was drawn or moved by the reveal.
    expect(miss.zone('p2', 'deck')).toHaveLength(10);
    expect(hand(miss, 'p2')).toHaveLength(0);
  });

  it('reads the base cost: a cost 1 card matches the chosen 1, and 0 matches only a cost 0', () => {
    const one = mk(V.c1);
    answer(one, 1);
    expect(one.zone('p2', 'characters')).toHaveLength(0);
    const zero = mk(V.c1);
    answer(zero, 0);
    expect(zero.zone('p2', 'characters')).toHaveLength(1);
  });

  it('shows the revealed card to both players, and only that one', () => {
    const g = mk(V.c3);
    expect(known(g, 'p1')).toEqual({});
    answer(g, 9);
    // Both players know the top card of that deck, and only that one.
    for (const viewer of ['p1', 'p2'] as const)
      expect(known(g, viewer)).toEqual({ 'p2.deck.0': V.c3 });
    const rev = g.eventsOfType('CardRevealed').find((e) => e.reason === 'effect')!;
    expect(rev).toMatchObject({ card: V.c3, from: 'deck', player: 'p1', owner: 'p2' });
  });

  it('leaks nothing before the reveal: two decks that differ in the top card ask the same', () => {
    const a = mk(V.c3);
    const b = mk(V.c5);
    run(a);
    run(b);
    // The decision, and what p2 is told so far, are the same whatever the top card is.
    expect(JSON.stringify(project(a.state, 'p1').decision)).toBe(
      JSON.stringify(project(b.state, 'p1').decision),
    );
    expect(JSON.stringify(projectEvents(a.events, 'p2'))).toBe(
      JSON.stringify(projectEvents(b.events, 'p2')),
    );
    option(a, '3');
    option(b, '3');
    // After the reveal the card is public to both players (and that is the point).
    expect(known(a, 'p2')['p2.deck.0']).toBe(V.c3);
    expect(known(b, 'p2')['p2.deck.0']).toBe(V.c5);
    expect(known(a, 'p1')['p2.deck.0']).toBe(V.c3);
  });

  it('an empty opposing deck reveals nothing and the comparison fails quietly', () => {
    const g = mk(V.c3, []);
    run(g);
    option(g, '3');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('the revealed card is drawn by its owner afterwards as any known top card', () => {
    const g = mk(V.c3);
    answer(g, 9);
    g.act({ type: 'endTurn' });
    // p2 draws the revealed card in their Draw Phase.
    expect(hand(g, 'p2')[0]).toBe(V.c3);
  });
});
