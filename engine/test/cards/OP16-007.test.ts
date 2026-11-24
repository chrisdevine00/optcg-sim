/** OP16-007 Jozu. */
import { describe, expect, it } from 'vitest';
import { accept, decline, game, hand, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAccept, RED_LEADER, WB7, WB8 } from './helpers-op16g1.ts';

const ID = 'OP16-007';

describe('OP16-007 Jozu', () => {
  const start = (handCards: string[]) =>
    game(
      { leader: RED_LEADER, hand: [ID, ...handCards], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c5] },
    );

  it('[Blocker]', () => {
    const g = game({ leader: RED_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[On Play]: reveal a Character card with 8000 power: up to 1 of your opponent's Characters gets -1000 power this turn", () => {
    const g = start([WB8]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', WB8)]);
    const target = g.find('p2', 'characters', V.c5);
    pick(g, [target]);
    expect(g.power(target)).toBe(6000);
    // The revealed card stays in hand.
    expect(hand(g, 'p1')).toEqual([WB8]);
    g.act({ type: 'endTurn' });
    expect(g.power(target)).toBe(7000);
  });

  it('cannot be paid with a 7000 power Character', () => {
    const g = start([WB7]);
    play(g, ID);
    expect(canAccept(g)).toBe(false);
  });

  it('declining gives no power change', () => {
    const g = start([WB8]);
    play(g, ID);
    decline(g);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });
});
