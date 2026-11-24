/** OP16-026 Emporio.Ivankov. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { orderAll } from './helpers-hancock-rosi.ts';
import { idsIn, IMPEL_G, IMPEL_V, offers, RED_LEADER } from './helpers-op16g1.ts';

const ID = 'OP16-026';

describe('OP16-026 Emporio.Ivankov', () => {
  /** Top 3: an {Impel Down} Purple card, a non-Impel card, an {Impel Down} Green card. */
  const start = (deck: string[], handCards: string[] = [V.c2, V.c4]) =>
    game(
      { leader: RED_LEADER, hand: [ID, ...handCards], deck, costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
  const TOP = [IMPEL_V, V.c3, IMPEL_G, BLUE, BLUE];

  it('[On Play]: look at 3, reveal up to 1 {Impel Down} card to your hand, the rest to the bottom; then play up to 1 Character with a cost of 2 or less from your hand', () => {
    const g = start(TOP);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Only the {Impel Down} cards among the 3 are offered.
    expect(offers(g, g.find('p1', 'deck', IMPEL_V))).toBe(true);
    expect(offers(g, g.find('p1', 'deck', IMPEL_G))).toBe(true);
    expect(offers(g, g.find('p1', 'deck', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'deck', IMPEL_G)]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(IMPEL_G);
    orderAll(g);
    expect(hand(g, 'p1')).toContain(IMPEL_G);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([BLUE, BLUE]);
    expect(deck.slice(2).sort()).toEqual([IMPEL_V, V.c3].sort());
  });

  it('then plays a Character with cost 2 or less: the card just added is eligible, a cost 4 one is not', () => {
    const g = start(TOP);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', IMPEL_V)]);
    orderAll(g);
    expectDecision(g, 'choose', 'p1');
    expect(offers(g, g.find('p1', 'hand', IMPEL_V))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', V.c2))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', V.c4))).toBe(false);
    pick(g, [g.find('p1', 'hand', IMPEL_V)]);
    expect(idsIn(g, 'p1', 'characters')).toEqual([ID, IMPEL_V]);
  });

  it('"up to 1": nothing may be taken and nothing played; all 3 go to the bottom', () => {
    const g = start(TOP);
    play(g, ID);
    none(g);
    orderAll(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([V.c2, V.c4]);
    expect(idsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('with no {Impel Down} card in the top 3 the play step still happens', () => {
    const g = start([V.c3, V.c5, V.c6, IMPEL_V, BLUE]);
    play(g, ID);
    none(g); // nothing matches, so only "done" is on offer
    orderAll(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(idsIn(g, 'p1', 'characters')).toEqual([ID, V.c2]);
  });
});
