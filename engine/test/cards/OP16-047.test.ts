/** OP16-047 Donquixote Doflamingo. */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, dec, game, hand, pick } from './helpers.ts';
import { BLUE_LEADER, IMPEL_LEADER } from './helpers-op16g2.ts';

const ID = 'OP16-047';

describe('OP16-047 Donquixote Doflamingo', () => {
  const start = (oppHand: number) =>
    game(
      { leader: IMPEL_LEADER, characters: [ID] },
      {
        leader: BLUE_LEADER,
        hand: Array.from({ length: oppHand }, (_, i) => (i < 2 ? BLUE : PURPLE)),
        deck: [PURPLE, PURPLE],
      },
    );
  const act = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'activate' });
  const canAct = (g: ReturnType<typeof start>) =>
    g.isLegal({
      type: 'activate',
      card: g.find('p1', 'characters', ID),
      ability: 'activate',
      player: 'p1',
    });

  it('[Activate: Main] rest this Character: with 8 cards in hand the opponent places 2 of their choice at the bottom of their deck', () => {
    const g = start(8);
    act(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    // The opponent chooses their own cards.
    expect(dec(g)?.player).toBe('p2');
    pick(g, [g.find('p2', 'hand', BLUE, 0), g.find('p2', 'hand', BLUE, 1)]);
    // The two go to the bottom in an order their owner picks.
    expect(dec(g)?.kind).toBe('order');
    g.act(g.legal().find((a) => a.type === 'order')!);
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(
      g
        .zone('p2', 'deck')
        .slice(-2)
        .map((c) => c.card),
    ).toEqual([BLUE, BLUE]);
    expect(g.zone('p2', 'deck')).toHaveLength(4);
  });

  it('with 7 cards in hand nothing is placed (the Character is still rested for the cost)', () => {
    const g = start(7);
    act(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(hand(g, 'p2')).toHaveLength(7);
    expect(dec(g)?.player).toBe('p1');
  });

  it('with more than 8 the opponent still places exactly 2', () => {
    const g = start(10);
    act(g);
    pick(g, [g.find('p2', 'hand', BLUE, 0), g.find('p2', 'hand', BLUE, 1)]);
    g.act(g.legal().find((a) => a.type === 'order')!);
    expect(hand(g, 'p2')).toHaveLength(8);
  });

  it('cannot be activated while this Character is rested', () => {
    const g = game(
      { leader: IMPEL_LEADER, characters: [{ card: ID, rested: true }] },
      { leader: BLUE_LEADER, hand: Array.from({ length: 8 }, () => PURPLE) },
    );
    expect(canAct(g)).toBe(false);
  });

  it('can be used again only after it untaps: not twice in one turn', () => {
    const g = start(8);
    act(g);
    pick(g, [g.find('p2', 'hand', BLUE, 0), g.find('p2', 'hand', BLUE, 1)]);
    expect(canAct(g)).toBe(false);
  });
});
