/** OP14-119 Dracule Mihawk. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  dec,
  expectDecision,
  none,
  pick,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { game } from './helpers.ts';
import { plant } from './helpers-op15g2.ts';
import { canAccept } from './helpers-op16g1.ts';
import { OTHER_LEADER, start } from './helpers-op14g4.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'OP14-119';
/** Newgate (cost 9, [On Play] only) and Luffy (cost 10 vanilla). */
const COST9 = 'OP02-004';
const COST10 = 'P-041';

describe('OP14-119 Dracule Mihawk', () => {
  describe('[Your Turn] when this Character becomes rested', () => {
    const attack = (p2chars: string[]) => {
      const g = start(
        { leader: OTHER_LEADER, characters: [ID], life: [BLUE, BLUE, BLUE] },
        { characters: p2chars, life: [BLUE, BLUE, BLUE] },
      );
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      return g;
    };
    /** A planted p1 effect "rest up to all of the opponent's Characters". */
    const restAll = (g: TestGame) =>
      plant(g, 'p1', { rest: { from: 'characters', owner: 'opponent' } });
    const finish = (g: TestGame) => {
      while (dec(g)?.kind === 'block' || dec(g)?.kind === 'counter' || dec(g)?.kind === 'trigger') {
        if (dec(g)!.kind === 'block') g.act({ type: 'block', blocker: null });
        else if (dec(g)!.kind === 'counter') g.act({ type: 'endCounter' });
        else g.act({ type: 'trigger', activate: false });
      }
    };

    it("attacking rests it: an opposing cost 9 Character cannot be rested by effects until the end of the opponent's next End Phase", () => {
      const g = attack([V.c7, COST9]);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p2', 'characters', COST9)]);
      finish(g);
      restAll(g);
      const chars = g.zone('p2', 'characters');
      expect(chars.find((c) => c.card === COST9)!.rested).toBe(false);
      expect(chars.find((c) => c.card === V.c7)!.rested).toBe(true);
    });

    it('cost 10 is not a candidate (9 or less), cost 9 is', () => {
      const g = attack([COST10, COST9, V.c7]);
      const o = g
        .legal()
        .filter((a) => a.type === 'pick')
        .map((a) => (a.type === 'pick' ? a.choice : null));
      expect(o).toContain(g.find('p2', 'characters', COST9));
      expect(o).toContain(g.find('p2', 'characters', V.c7));
      expect(o).not.toContain(g.find('p2', 'characters', COST10));
      none(g);
    });

    it('"up to 1": choosing none restricts nothing', () => {
      const g = attack([COST9]);
      none(g);
      finish(g);
      restAll(g);
      expect(g.zone('p2', 'characters')[0]!.rested).toBe(true);
    });

    it("the restriction ends with the opponent's End Phase: it can be rested again afterwards", () => {
      const g = attack([COST9]);
      pick(g, [g.find('p2', 'characters', COST9)]);
      finish(g);
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      // p2's next turn: plant on p2's side (p2 rests its own Character via an effect).
      plant(g, 'p2', { rest: { from: 'characters', owner: 'you' } });
      expect(g.zone('p2', 'characters').find((c) => c.card === COST9)!.rested).toBe(true);
    });

    it("does not apply on the opponent's turn: Mihawk rested by an opposing effect asks nothing", () => {
      const g = game(
        { leader: OTHER_LEADER, characters: [ID] },
        { leader: PLAIN_BLUE, characters: [V.c7, COST9] },
        { turn: 4, activePlayer: 'p2' },
      );
      plant(g, 'p2', { rest: { from: 'characters', owner: 'opponent' } });
      expect(g.zone('p1', 'characters')[0]!.rested).toBe(true);
      expectDecision(g, 'main', 'p2');
    });
  });

  describe("[On Your Opponent's Attack] [Once Per Turn]", () => {
    const attacked = (handCards: string[], extraAttackers: string[] = []) => {
      const g = game(
        { leader: OTHER_LEADER, characters: [ID], hand: handCards, life: [BLUE, BLUE, BLUE] },
        { leader: PLAIN_BLUE, characters: [V.c5, ...extraAttackers] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
      return g;
    };

    it('you may trash 1 card from your hand: your Leader gains +2000 power during this battle', () => {
      const g = attacked([V.c1, V.c2]);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(7000);
      expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([V.c2]);
      expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.c1]);
    });

    it('the +2000 may go to a Character; "up to 1" may be declined after paying', () => {
      const g = attacked([V.c1]);
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      pick(g, [g.find('p1', 'characters', ID)]);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(12000);
    });

    it('declining the cost does nothing (no card trashed, no bonus)', () => {
      const g = attacked([V.c1]);
      decline(g);
      expect(g.zone('p1', 'hand')).toHaveLength(1);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('with an empty hand the cost cannot be paid: nothing is offered', () => {
      const g = attacked([]);
      expectDecision(g, 'optional', 'p1');
      expect(canAccept(g)).toBe(false);
      decline(g);
      expect(dec(g)?.kind).toBe('block');
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('Once Per Turn: a second attack in the same turn does not offer it again', () => {
      const g = attacked([V.c1, V.c2], [V.c4]);
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      pick(g, [g.leader('p1')]);
      g.act({ type: 'block', blocker: null });
      g.act({ type: 'endCounter' });
      while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
      expect(dec(g)?.kind).toBe('block');
    });
  });
});
