/** EB05-007 Monet. */
import { describe, expect, it } from 'vitest';
import { accept, decline, game, hand, pick, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { EVENTS } from './helpers-luffyace.ts';

const ID = 'EB05-007';
/** OP11-015 Mocha: a {Punk Hazard} type Character. */
const PUNK = 'OP11-015';

describe('EB05-007 Monet', () => {
  const start = (extra: string[]) =>
    game(
      { leader: PLAIN_PURPLE, hand: [ID, ...extra], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: reveal a total of 3 Event or {Punk Hazard} cards from your hand: draw 1 card', () => {
    const g = start([...EVENTS, PUNK, V.c1]);
    play(g, ID);
    accept(g);
    pick(g, [
      g.find('p1', 'hand', EVENTS[0]),
      g.find('p1', 'hand', EVENTS[1]),
      g.find('p1', 'hand', PUNK),
    ]);
    // The 3 revealed cards stay in hand; 1 card drawn.
    expect(hand(g, 'p1')).toHaveLength(5);
    expect(hand(g, 'p1')).toEqual(expect.arrayContaining([...EVENTS, PUNK]));
  });

  it('the cost cannot be paid with only 2 matching cards in hand (a card of another type does not count)', () => {
    const g = start([...EVENTS, V.c1]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('declining draws nothing', () => {
    const g = start([...EVENTS, PUNK]);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it("[End of Your Turn]: this Character gains +5000 power until the end of your opponent's next End Phase", () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: PLAIN_BLUE });
    const monet = g.find('p1', 'characters', ID);
    expect(g.power(monet)).toBe(1000);
    g.act({ type: 'endTurn' });
    // The opponent's turn: still +5000.
    expect(g.power(monet)).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(g.power(monet)).toBe(1000);
  });

  it("[End of Your Turn] does not fire at the end of your opponent's turn", () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(1000);
  });
});
