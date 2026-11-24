/** OP16-005 Thatch. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE, V } from './helpers.ts';
import { NON_WB8, RED_LEADER, WB7, WB8 } from './helpers-op16g1.ts';

const ID = 'OP16-005';

describe('OP16-005 Thatch', () => {
  const costWith = (chars: Parameters<typeof game>[0]['characters'], active = 0) => {
    const g = game(
      { leader: RED_LEADER, hand: [ID], characters: chars, costArea: { active, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    return { g, id: g.find('p1', 'hand', ID) };
  };

  it('in hand: -3 cost if you have a Whitebeard Pirates Character with 8000 power or more', () => {
    const { g, id } = costWith([WB8], 5);
    expect(g.card(id).cost).toBe(5);
    expect(g.isLegal({ type: 'playCard', card: id, player: 'p1' })).toBe(true);
  });

  it('without such a Character it costs its printed 8', () => {
    const { g, id } = costWith([V.c4], 5);
    expect(g.card(id).cost).toBe(8);
    expect(g.isLegal({ type: 'playCard', card: id, player: 'p1' })).toBe(false);
  });

  it('threshold: a 7000 Whitebeard Character is not enough, 7000 plus 1 given DON!! (8000) is', () => {
    expect(costWith([WB7]).g.card(costWith([WB7]).id).cost).toBe(8);
    const { g, id } = costWith([{ card: WB7, don: 1 }]);
    expect(g.card(id).cost).toBe(5);
  });

  it('an 8000 Character without a Whitebeard Pirates type does not count', () => {
    const { g, id } = costWith([NON_WB8]);
    expect(g.card(id).cost).toBe(8);
  });

  it('[Blocker] on the field', () => {
    const g = game({ leader: RED_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
