/** OP12-107 Donquixote Doflamingo. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, play, V } from './helpers.ts';
import { koBy } from './helpers-w3s.ts';
import { cardsIn, mk, rep } from './helpers-op12g3.ts';

const ID = 'OP12-107';

describe('OP12-107 Donquixote Doflamingo', () => {
  it('with 2 or less Life it gains [Rush] and can attack the turn it is played', () => {
    const g = mk({ hand: [ID], life: rep(2, V.c1) });
    play(g, ID);
    const d = g.find('p1', 'characters', ID);
    expect(g.card(d).keywords).toContain('Rush');
    expect(g.isLegal({ type: 'attack', attacker: d, target: g.leader('p2'), player: 'p1' })).toBe(
      true,
    );
  });

  it('boundary: 3 Life: no [Rush], and it cannot attack the turn it is played', () => {
    const g = mk({ hand: [ID], life: rep(3, V.c1) });
    play(g, ID);
    const d = g.find('p1', 'characters', ID);
    expect(g.card(d).keywords).not.toContain('Rush');
    expect(g.isLegal({ type: 'attack', attacker: d, target: g.leader('p2'), player: 'p1' })).toBe(
      false,
    );
  });

  it("[Opponent's Turn] [On K.O.] adds up to 1 card from the top of the deck to the top of your Life", () => {
    const g = mk({ characters: [ID], deck: [V.c2, V.c3] }, {}, { turn: 4, activePlayer: 'p2' });
    koBy(g, 'p1', ID, 'p2');
    accept(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c2);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c3]);
  });

  it('"up to 1": may add nothing', () => {
    const g = mk({ characters: [ID], deck: [V.c2, V.c3] }, {}, { turn: 4, activePlayer: 'p2' });
    koBy(g, 'p1', ID, 'p2');
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(cardsIn(g, 'p1', 'deck')).toHaveLength(2);
  });

  it("must not fire when K.O.'d on your own turn", () => {
    const g = mk({ characters: [ID], deck: [V.c2, V.c3] });
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(3);
  });
});
