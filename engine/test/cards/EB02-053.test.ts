/** EB02-053 Myskina Olga. */
import { describe, expect, it } from 'vitest';
import { project, type ProjectedView } from '@optcg/engine';
import { dec, game, option, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { atMain, ids, optionIds } from './helpers-w7c1.ts';
import { koBy } from './helpers-w3s.ts';

const ID = 'EB02-053';

describe('EB02-053 Myskina Olga', () => {
  const mk = (p1: object = {}, p2: object = {}) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: [ID],
        costArea: { active: 3, rested: 0 },
        life: [V.c3, V.c1, V.c2],
        ...p1,
      },
      { leader: PLAIN_BLUE, life: [V.c6, V.c4, V.c5], ...p2 },
    );
  const play = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

  it('[On Play]: look at the top of your Life and place it at the bottom (it never leaves Life)', () => {
    const g = mk();
    play(g);
    expect(optionIds(g)).toEqual(['you', 'opponent', 'none']);
    option(g, 'you');
    const view = project(g.state, 'p1') as unknown as ProjectedView;
    expect(view.looking.map((c) => c.card)).toEqual([V.c3]);
    option(g, 'bottom');
    expect(ids(g, 'p1', 'life')).toEqual([V.c1, V.c2, V.c3]);
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it("[On Play]: your opponent's top Life card, kept on top; the other player is not shown it", () => {
    const g = mk();
    play(g);
    option(g, 'opponent');
    const theirs = project(g.state, 'p2') as unknown as ProjectedView;
    expect(theirs.looking).toEqual([]);
    option(g, 'top');
    expect(ids(g, 'p2', 'life')).toEqual([V.c6, V.c4, V.c5]);
    expect(ids(g, 'p1', 'life')).toEqual([V.c3, V.c1, V.c2]);
  });

  it('[On Play]: "up to 1" may look at none', () => {
    const g = mk();
    play(g);
    option(g, 'none');
    expect(ids(g, 'p1', 'life')).toEqual([V.c3, V.c1, V.c2]);
    expect(ids(g, 'p2', 'life')).toEqual([V.c6, V.c4, V.c5]);
    expect(g.eventsOfType('CardsLooked')).toHaveLength(0);
    expect(atMain(g)).toBe(true);
  });

  it('[On K.O.]: the same look when she is K.O.d, by either player, and her own Life is offered', () => {
    const g = mk({ hand: [], characters: [ID] });
    koBy(g, 'p1', ID, 'p2');
    expect(dec(g)?.kind).toBe('choose');
    expect(optionIds(g)).toEqual(['you', 'opponent', 'none']);
    option(g, 'opponent');
    option(g, 'bottom');
    expect(ids(g, 'p2', 'life')).toEqual([V.c4, V.c5, V.c6]);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('with only one player holding Life cards only that area is offered; with none nothing is asked', () => {
    const g = mk({ life: [] });
    play(g);
    expect(optionIds(g)).toEqual(['opponent', 'none']);
    option(g, 'none');
    const empty = mk({ life: [] }, { life: [] });
    play(empty);
    expect(atMain(empty)).toBe(true);
    expect(empty.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('must not look at Life when another Character of yours is K.O.d', () => {
    const g = mk({ hand: [], characters: [ID, V.c1] });
    koBy(g, 'p1', V.c1, 'p2');
    expect(atMain(g)).toBe(true);
    expect(g.eventsOfType('CardsLooked')).toHaveLength(0);
  });
});
