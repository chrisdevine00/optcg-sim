/** OP18-097 Abyss Pentagram. OP-18 wave G5. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { BLUE, game, hand, play, PLAIN_BLUE, trash } from './helpers.ts';
import { CD_LEADER, FIVE4, HK1 } from './helpers-op18-w2.ts';
import { PLAIN_PURPLE } from './helpers-op18.ts';

const ID = 'OP18-097';
const board = (leader: string, active: number, handCards: string[]) =>
  game(
    { leader, stage: ID, hand: handCards, costArea: { active, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
const canPlay = (g: ReturnType<typeof board>, id: string) =>
  g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', id));

describe('OP18-097 Abyss Pentagram', () => {
  it('with a {Celestial Dragons} Leader a cost 4 {Five Elders} Character plays for 3', () => {
    const g = board(CD_LEADER, 3, [FIVE4]);
    expect(canPlay(g, FIVE4)).toBe(true);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', FIVE4) });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([FIVE4]);
  });

  it('the view tells the owner the discounted play cost; without the discount it is absent', () => {
    const g = board(CD_LEADER, 3, [FIVE4]);
    const v = queries.card(g.state, g.find('p1', 'hand', FIVE4));
    expect(v).toMatchObject({ cost: 4, playCost: 3 });
    const h = board(PLAIN_PURPLE, 3, [FIVE4]);
    expect(queries.card(h.state, h.find('p1', 'hand', FIVE4)).playCost).toBeUndefined();
  });

  it('not with another Leader', () => {
    expect(canPlay(board(PLAIN_PURPLE, 3, [FIVE4]), FIVE4)).toBe(false);
  });

  it('a cost 1 card is not reduced ("a cost of 2 or more")', () => {
    expect(canPlay(board(CD_LEADER, 0, [HK1]), HK1)).toBe(false);
  });

  it('[On Play] draws 1 and trashes the top 2 cards of the deck', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [ID],
        deck: ['OP01-103', 'OP01-107', 'OP01-110', BLUE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(hand(g, 'p1')).toEqual(['OP01-103']);
    expect(trash(g, 'p1').sort()).toEqual(['OP01-107', 'OP01-110'].sort());
  });
});
