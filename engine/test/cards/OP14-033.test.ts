/** OP14-033 Perona. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, koBy } from './helpers-w3s.ts';
import { cardsIn, G3, G5, G6, mk, restedCard } from './helpers-op14g1.ts';
import { applyOp } from '../../src/testing.ts';

const ID = 'OP14-033';

describe('OP14-033 Perona', () => {
  const onPlay = () => {
    const g = mk({ hand: [ID] }, { characters: [V.c1, V.c4, V.c5, V.c6] });
    play(g, ID);
    return g;
  };

  it("[On Play]: up to 2 of the opponent's Characters with a cost of 5 or less cannot be rested", () => {
    const g = onPlay();
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // boundary
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c5)]);
    for (const c of [V.c4, V.c5]) {
      const id = g.find('p2', 'characters', c);
      g.state = applyOp(g.state, { op: 'rest', card: id }).state;
      expect(g.card(id).rested).toBe(false);
    }
    const free = g.find('p2', 'characters', V.c1);
    g.state = applyOp(g.state, { op: 'rest', card: free }).state;
    expect(g.card(free).rested).toBe(true);
  });

  it('"up to 2": at most 2 can be chosen, and none is allowed', () => {
    const g = onPlay();
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c4)]);
    expectDecision(g, 'main', 'p1'); // a third is not asked
    const h = onPlay();
    none(h);
    const id = h.find('p2', 'characters', V.c1);
    h.state = applyOp(h.state, { op: 'rest', card: id }).state;
    expect(h.card(id).rested).toBe(true);
  });

  it("a protected Character cannot attack on the opponent's next turn, and it ends after their End Phase", () => {
    const g = onPlay();
    pick(g, [g.find('p2', 'characters', V.c4)]);
    g.act({ type: 'endTurn' });
    const id = g.find('p2', 'characters', V.c4);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === id)).toBe(false);
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p2', 'characters', V.c1)),
    ).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' }); // p2's turn 6: the restriction is long gone
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === id)).toBe(true);
  });

  describe('[On K.O.] you may rest 1 of your cards: play up to 1 green Character with a cost of 5 or less from your hand', () => {
    const start = (hand = [G3, G5, G6, V.c4]) => {
      const g = mk({ characters: [ID], hand, costArea: { active: 0, rested: 0 } });
      koBy(g, 'p1', ID, 'p2');
      return g;
    };

    it('pays by resting a card, then plays the chosen green Character', () => {
      const g = start();
      expectDecision(g, 'optional', 'p1');
      accept(g);
      // The Leader is the only active card left (Perona was K.O.'d): the cost is paid without a choice.
      expect(g.card(g.leader('p1')).rested).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', G3))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', G5))).toBe(true); // cost 5 boundary
      expect(canPick(g, g.find('p1', 'hand', G6))).toBe(false);
      expect(canPick(g, g.find('p1', 'hand', V.c4))).toBe(false); // not green
      pick(g, [g.find('p1', 'hand', G5)]);
      expect(cardsIn(g, 'p1', 'characters')).toEqual([G5]);
    });

    it('declined: nothing is rested or played', () => {
      const g = start();
      decline(g);
      expect(g.card(g.leader('p1')).rested).toBe(false);
      expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    });

    it('"up to 1": after paying, may play nothing', () => {
      const g = start();
      accept(g);
      none(g);
      expect(cardsIn(g, 'p1', 'hand')).toHaveLength(4);
    });

    it('not offered when there is no active card to rest', () => {
      const g = mk({
        leader: { card: 'ST01-001', rested: true },
        characters: [ID],
        hand: [G3],
        costArea: { active: 0, rested: 0 },
      });
      koBy(g, 'p1', ID, 'p2');
      expect(dec(g)?.kind).toBe('main');
      expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    });

    it('a rested Leader does not stop it when a Character can pay', () => {
      const g = mk({
        leader: restedCard('ST01-001'),
        characters: [ID, V.c1],
        hand: [G3],
        costArea: { active: 0, rested: 0 },
      });
      koBy(g, 'p1', ID, 'p2');
      accept(g);
      expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', G3))).toBe(true);
    });
  });
});
