/** OP17-053 Barbell. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, pick, trash, V, game, PLAIN_BLUE } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { koedInBattle, OTHER_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-053';

describe('OP17-053 Barbell', () => {
  it('[On K.O.]: your opponent places 2 cards from their hand at the bottom of their deck (their choice)', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER }, { hand: [V.c1, V.c2, V.c3] });
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', V.c1), g.find('p2', 'hand', V.c3)]);
    g.act(g.legal().find((a) => a.type === 'order')!);
    expect(hand(g, 'p2')).toEqual([V.c2]);
    expect(cardsOf(g, 'p2', 'deck').slice(-2).sort()).toEqual([V.c1, V.c3].sort());
    expect(cardsOf(g, 'p2', 'deck')).toHaveLength(12);
  });

  it('with only 1 card in hand the opponent places that card', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER }, { hand: [V.c1] });
    if (expectDecisionOpt(g)) pick(g, [g.find('p2', 'hand', V.c1)]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(cardsOf(g, 'p2', 'deck').at(-1)).toBe(V.c1);
  });

  it('with an empty opponent hand nothing happens', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER }, { hand: [] });
    expect(cardsOf(g, 'p2', 'deck')).toHaveLength(10);
  });

  describe('[Activate: Main] [Once Per Turn]', () => {
    const board = () =>
      game({ leader: OTHER_LEADER, characters: [ID], hand: [BLUE] }, { leader: PLAIN_BLUE });

    it('you may trash 1 card from your hand: this Character gains +3000 power during this turn', () => {
      const g = board();
      const barbell = g.find('p1', 'characters', ID);
      expect(g.power(barbell)).toBe(7000);
      g.act({ type: 'activate', card: barbell, ability: 'boost' });
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expect(g.power(barbell)).toBe(10000);
      expect(trash(g, 'p1')).toEqual([BLUE]);
      expect(g.isLegal({ type: 'activate', card: barbell, ability: 'boost', player: 'p1' })).toBe(
        false,
      );
    });

    it('the boost ends with the turn', () => {
      const g = board();
      const barbell = g.find('p1', 'characters', ID);
      g.act({ type: 'activate', card: barbell, ability: 'boost' });
      pick(g, [g.find('p1', 'hand', BLUE)]);
      g.act({ type: 'endTurn' });
      expect(g.power(barbell)).toBe(7000);
    });

    it('with an empty hand it cannot be activated', () => {
      const g = game({ leader: OTHER_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
      const barbell = g.find('p1', 'characters', ID);
      expect(g.isLegal({ type: 'activate', card: barbell, ability: 'boost', player: 'p1' })).toBe(
        false,
      );
    });
  });
});

function expectDecisionOpt(g: Parameters<typeof hand>[0]): boolean {
  return g.legal().some((a) => a.type === 'pick');
}
