/** OP17-041 Wang Zhi. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  expectDecision,
  game,
  PLAIN_BLUE,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { OTHER_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-041';

describe('OP17-041 Wang Zhi', () => {
  const start = () =>
    game(
      { leader: OTHER_LEADER, hand: [ID, BLUE], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1, V.c2, { card: V.c1, rested: true }, V.c3] },
    );

  it('[On Play]: trash 1 card from your hand: all opponent Characters with a base cost of 1 go to the bottom of their deck', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    // The owner may be asked to order the cards (identical here): answer any such decision.
    while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2, V.c3]);
    expect(cardsOf(g, 'p2', 'deck').slice(-2)).toEqual([V.c1, V.c1]);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('declining the cost moves nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([BLUE]);
  });

  it('with no opponent Character of base cost 1 the cost is paid and nothing moves', () => {
    const g = game(
      { leader: OTHER_LEADER, hand: [ID, BLUE], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c2, V.c3] },
    );
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(trash(g, 'p1')).toEqual([BLUE]);
  });

  it('only the opponent is affected: your own base cost 1 Characters stay', () => {
    const g = game(
      {
        leader: OTHER_LEADER,
        hand: [ID, BLUE],
        characters: [V.c1],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c1, ID]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('has [Blocker]', () => {
    const g = start();
    const id = play(g, ID);
    decline(g);
    expect(g.card(id).keywords).toContain('Blocker');
    expectDecision(g, 'main', 'p1');
  });
});
