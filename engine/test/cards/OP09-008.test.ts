/** OP09-008 Building Snake. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { activate, game, offeredAb } from './helpers-w6c1.ts';

const ID = 'OP09-008';

describe('OP09-008 Building Snake', () => {
  const mk = (oppChars: string[], extra: Parameters<typeof game>[0] = { leader: PLAIN_PURPLE }) =>
    game({ ...extra, characters: [ID] }, { leader: PLAIN_BLUE, characters: oppChars });
  const go = (g: ReturnType<typeof mk>) => activate(g, g.find('p1', 'characters', ID), 'activate');

  it('places this Character at the bottom of the deck, then gives up to 1 opposing Character -3000 power this turn', () => {
    const g = mk([V.c3, V.c1]);
    const deckBefore = g.zone('p1', 'deck').length;
    go(g);
    // The cost is paid first: Snake is already in the deck.
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).power).toBe(2000);
    expect(g.card(g.find('p2', 'characters', V.c1)).power).toBe(3000);
    const deck = g.zone('p1', 'deck');
    expect(deck).toHaveLength(deckBefore + 1);
    expect(deck[deck.length - 1]!.card).toBe(ID);
  });

  it('-3000 takes 3000 power to 0, and the loss ends with the turn', () => {
    const g = mk([V.c1]);
    go(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).power).toBe(0);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c1)).power).toBe(3000);
  });

  it('"up to 1": may choose nobody; the cost is paid all the same', () => {
    const g = mk([V.c3]);
    go(g);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c3)).power).toBe(5000);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('with no opposing Character the cost is paid and nothing is asked', () => {
    const g = mk([]);
    go(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('is offered while Snake is on the field, rested or not (resting is not part of the cost)', () => {
    const g = mk([V.c3]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
  });

  it('must not touch your own Characters', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID, V.c3] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    go(g);
    // Only the opposing Character is offered.
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p1', 'characters', V.c3)).power).toBe(5000);
  });
});
