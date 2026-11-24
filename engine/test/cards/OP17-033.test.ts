/** OP17-033 Lucky.Roux. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  game,
  hand,
  PLAIN_BLUE,
  pick,
  play,
  V,
} from './helpers.ts';
import { cardsOf, finishOrder } from './helpers-luffyace.ts';
import { OTHER_LEADER, RHP_4, RHP_5 } from './helpers-op17g2.ts';

const ID = 'OP17-033';

describe('OP17-033 Lucky.Roux', () => {
  it('[On Play]: look at 3, add up to 1 card with a type including "Red-Haired Pirates", the rest to the bottom', () => {
    const g = game(
      {
        leader: OTHER_LEADER,
        hand: [ID],
        deck: [BLUE, RHP_4, BLUE, RHP_5, BLUE],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', RHP_4)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([RHP_4]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(RHP_5);
  });

  describe("[On Your Opponent's Attack]", () => {
    const attacked = () => {
      const g = game(
        { leader: OTHER_LEADER, characters: [ID] },
        { leader: PLAIN_BLUE, characters: [V.c6, V.c3] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c6),
        target: g.leader('p1'),
      });
      return g;
    };

    it("you may trash this Character: rest up to 1 of the opponent's Leader or Characters", () => {
      const g = attacked();
      expectDecision(g, 'optional', 'p1');
      accept(g);
      // The opponent's Leader and both Characters are candidates.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
      pick(g, [g.leader('p2')]);
      expect(g.card(g.leader('p2')).rested).toBe(true);
      expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });

    it("may rest an opponent's Character instead (even the attacker)", () => {
      const g = attacked();
      accept(g);
      const attacker = g.find('p2', 'characters', V.c6);
      pick(g, [attacker]);
      expect(g.card(attacker).rested).toBe(true);
    });

    it('declining keeps the Character and rests nothing', () => {
      const g = attacked();
      decline(g);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
      expect(g.card(g.leader('p2')).rested).toBe(false);
      expectDecision(g, 'block', 'p1');
      g.act({ type: 'block', blocker: null });
      endCounter(g);
    });

    it('does not trigger when its owner attacks', () => {
      const g = game({ leader: OTHER_LEADER, characters: [ID, V.c1] }, { leader: PLAIN_BLUE });
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c1), target: g.leader('p2') });
      expectDecision(g, 'block', 'p2');
    });
  });
});
