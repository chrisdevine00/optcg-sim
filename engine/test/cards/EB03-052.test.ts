/** EB03-052 Shirahoshi. */
import { describe, expect, it } from 'vitest';
import { expectDecision, trash, V } from './helpers.ts';
import { mk, NEPT6, SHIRAHOSHI_LEADER } from './helpers-eb03g2.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'EB03-052';
const use = (g: TestGame) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'main' });

describe('EB03-052 Shirahoshi', () => {
  it('[Activate: Main] trash this Character: with [Shirahoshi] as Leader adds the top deck card to the top of your Life, and your {Neptunian} Characters gain +1000', () => {
    const g = mk(
      { leader: SHIRAHOSHI_LEADER, characters: [ID, NEPT6, V.c3], deck: [V.c5, V.c6, V.c7] },
      { characters: [NEPT6] },
    );
    use(g);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c5);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
    expect(g.power(g.find('p1', 'characters', NEPT6))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000); // not {Neptunian}
    expect(g.power(g.find('p2', 'characters', NEPT6))).toBe(8000); // the opponent's, untouched
  });

  it('with another Leader the Character is still trashed (the cost) and nothing else happens, the +1000 included', () => {
    const g = mk({ characters: [ID, NEPT6], deck: [V.c5, V.c6, V.c7] });
    use(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.find('p1', 'characters', NEPT6))).toBe(8000);
    expectDecision(g, 'main', 'p1');
  });

  it('the +1000 lasts this turn only', () => {
    const g = mk({ leader: SHIRAHOSHI_LEADER, characters: [ID, NEPT6], deck: [V.c5, V.c6, V.c7] });
    use(g);
    expect(g.power(g.find('p1', 'characters', NEPT6))).toBe(9000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', NEPT6))).toBe(8000);
  });

  it('the Life card is added face-down on top of the Life cards, above the old top card', () => {
    const g = mk({
      leader: SHIRAHOSHI_LEADER,
      characters: [ID],
      deck: [V.c5, V.c6],
      life: [V.c1, V.c2, V.c3],
    });
    use(g);
    expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c5, V.c1, V.c2, V.c3]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('trashing is the cost, not an option of the effect: nothing is asked and Shirahoshi leaves', () => {
    const g = mk({ leader: SHIRAHOSHI_LEADER, characters: [ID], deck: [V.c5, V.c6] });
    use(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
