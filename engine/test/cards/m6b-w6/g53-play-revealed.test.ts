/**
 * M6b wave 6, G53: "reveal 1 card from the top of your deck (or Life). If that card is a Character
 * ..., you may play that card" (OP12-058, OP10-022). `play` reads the top card an earlier `reveal`
 * bound, from the deck or from Life (a card that leaves Life this way fires the Life watchers).
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents, type ProjectedView } from '@optcg/engine';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  accept,
  BLUE,
  dec,
  decline,
  expectDecision,
  game,
  hand,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  times,
  V,
} from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const reveal = (from: 'deckTop' | 'lifeTop') => ({
  do: { reveal: { from, n: 1, bind: 'r' } },
});
const playIt = (from: 'deckTop' | 'lifeTop', over: object = {}) => ({
  do: {
    play: {
      what: { from, owner: 'you', filter: { ref: 'r' }, pick: { exactly: 1 }, ...over },
    },
  },
});
const isSmall = { ref: 'r', matches: { all: [{ category: ['Character'] }, { cost: { lte: 5 } }] } };
/** "If that card is a Character with a cost of 5 or less, you may play that card. If you do, it gains [Rush]." */
const effect = (from: 'deckTop' | 'lifeTop') => [
  reveal(from),
  {
    if: isSmall,
    then: [
      { may: [playIt(from)], label: 'play' },
      {
        ifDid: 'play',
        then: [
          {
            do: {
              grant: {
                target: { from: 'characters', owner: 'you', filter: { ref: 'r' } },
                keyword: 'Rush',
                duration: 'thisTurn',
              },
            },
          },
        ],
      },
    ],
  },
];

const mkDeck = (top: string) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE], deck: [top, ...times(9, PURPLE)] },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [main(effect('deckTop') as never)]);
  return g;
};
const mkLife = (top: string) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE], life: [top, PURPLE, PURPLE] },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [main(effect('lifeTop') as never)]);
  return g;
};
const known = (g: ReturnType<typeof mkDeck>, viewer: 'p1' | 'p2') =>
  (project(g.state, viewer) as unknown as ProjectedView).known;

describe('G53 play the revealed top card of the deck or Life', () => {
  it('validates, and refuses the nonsense', () => {
    main(effect('deckTop') as never);
    main(effect('lifeTop') as never);
    const bad = (e: unknown[]) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: e });
    // The top of the deck is played only as the card a reveal showed.
    expect(bad([playIt('deckTop', { filter: undefined })])).not.toEqual([]);
    expect(
      bad([reveal('deckTop'), playIt('deckTop', { filter: { cost: { lte: 3 } } })]),
    ).not.toEqual([]);
    expect(bad([playIt('deckTop')])).not.toEqual([]); // `r` is not bound
    expect(bad([reveal('deckTop'), playIt('deckTop', { owner: 'opponent' })])).not.toEqual([]);
    expect(bad([reveal('deckTop'), playIt('deckTop', { pick: { upTo: 2 } })])).not.toEqual([]);
    expect(bad([reveal('deckTop'), playIt('deckTop', { from: ['deckTop', 'hand'] })])).not.toEqual(
      [],
    );
    expect(bad([reveal('lifeTop'), playIt('lifeTop', { filter: undefined })])).not.toEqual([]);
    // A card bound by a plain selector is not a revealed one.
    expect(
      bad([
        { do: { select: { from: 'characters', owner: 'you', bind: 'r', pick: { exactly: 1 } } } },
        playIt('deckTop'),
      ]),
    ).not.toEqual([]);
  });

  it('plays the revealed Character from the deck, and the effect after it sees the card', () => {
    const g = mkDeck(V.c3);
    run(g);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    // No second question: the revealed card is the only candidate and is no secret.
    expect(dec(g)?.kind).toBe('main');
    const id = g.find('p1', 'characters', V.c3);
    expect(g.card(id).keywords).toContain('Rush');
    expect(g.zone('p1', 'deck')[0]!.card).toBe(PURPLE);
    expect(g.eventsOfType('CardPlayed').pop()?.card).toBe(V.c3);
  });

  it('its [On Play] fires, as for any play by an effect', () => {
    const g = mkDeck(V.c3);
    g.state = withAbilities(g.state, V.c3, [
      { id: 'o', kind: 'auto', when: ['onPlay'], effect: [{ do: { draw: 1 } }] } as Ability,
    ]);
    const before = hand(g, 'p1').length;
    run(g);
    accept(g);
    expect(hand(g, 'p1').length).toBe(before + 1);
  });

  it('declined: the card stays on top, known to both players', () => {
    const g = mkDeck(V.c3);
    run(g);
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c3);
    expect(known(g, 'p1')['p1.deck.0']).toBe(V.c3);
    expect(known(g, 'p2')['p1.deck.0']).toBe(V.c3);
  });

  it('a card that does not fit the condition is not offered', () => {
    const big = mkDeck(V.c7);
    run(big);
    expect(dec(big)?.kind).toBe('main');
    expect(big.zone('p1', 'characters')).toHaveLength(1);
  });

  it('an empty deck reveals nothing and plays nothing', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE], deck: [] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [main(effect('deckTop') as never)]);
    run(g);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('the revealed card is public, so the other player learns it from the reveal alone', () => {
    const a = mkDeck(V.c3);
    run(a);
    const told = JSON.stringify(projectEvents(a.events, 'p2'));
    expect(told).toContain(V.c3);
    // Before the reveal, two decks that differ only in the top card look the same to p2.
    const x = mkDeck(V.c3);
    const y = mkDeck(V.c7);
    expect(JSON.stringify(project(x.state, 'p2'))).toBe(JSON.stringify(project(y.state, 'p2')));
  });

  it('Life: plays the revealed top Life card, and the Life watchers fire (OP10-022)', () => {
    const g = mkLife(V.c3);
    const watcher = {
      id: 'w',
      kind: 'auto',
      when: [{ event: 'lifeRemoved', owner: 'you' }],
      effect: [{ do: { draw: 1 } }],
    } as Ability;
    g.state = withAbilities(g.state, PLAIN_PURPLE, [watcher]);
    const before = hand(g, 'p1').length;
    run(g);
    accept(g);
    expect(g.life('p1')).toBe(2);
    expect(g.card(g.find('p1', 'characters', V.c3)).owner).toBe('p1');
    // Not damage: no [Trigger]; the watcher drew one card.
    expect(g.eventsOfType('TriggerRevealed')).toHaveLength(0);
    expect(hand(g, 'p1').length).toBe(before + 1);
  });

  it('Life: declined, the card stays face-down in Life; a card that does not fit is not offered', () => {
    const g = mkLife(V.c3);
    run(g);
    decline(g);
    expect(g.life('p1')).toBe(3);
    const big = mkLife(V.c7);
    run(big);
    expect(dec(big)?.kind).toBe('main');
    expect(big.life('p1')).toBe(3);
  });

  it('Life: the other player sees the revealed card and not the other Life cards', () => {
    const g = mkLife(V.c3);
    run(g);
    accept(g);
    const told = JSON.stringify(projectEvents(g.events, 'p2'));
    expect(told).toContain(V.c3);
    expect(told).not.toContain(PURPLE);
  });
});
