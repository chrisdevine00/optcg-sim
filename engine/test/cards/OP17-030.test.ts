/** OP17-030 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  option,
  PLAIN_BLUE,
  play,
  setMost,
  times,
} from './helpers.ts';
import { OTHER_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-030';

describe('OP17-030 Monkey.D.Luffy', () => {
  const start = (active: number) =>
    game(
      { leader: OTHER_LEADER, hand: [ID], costArea: { active, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [{ card: 'OP02-084', rested: true }] },
    );

  it('[On Play]: you may rest 1 DON!! card: this Character gains [Rush] during this turn', () => {
    const g = start(5);
    const luffy = play(g, ID);
    accept(g);
    expect(g.card(luffy).keywords).toContain('Rush');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    // Rush: it can attack the opponent's Leader this turn.
    expect(
      g.isLegal({ type: 'attack', attacker: luffy, target: g.leader('p2'), player: 'p1' }),
    ).toBe(true);
  });

  it('declining the cost gives no [Rush]', () => {
    const g = start(5);
    const luffy = play(g, ID);
    decline(g);
    expect(g.card(luffy).keywords).not.toContain('Rush');
    expect(don(g, 'p1').active).toBe(1);
  });

  it('with no active DON!! left after paying its cost, the cost cannot be paid', () => {
    const g = start(4);
    const luffy = play(g, ID);
    expect(g.card(luffy).keywords).not.toContain('Rush');
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
  });

  describe('[Activate: Main] [Once Per Turn]', () => {
    const board = (handSize: number) =>
      game(
        {
          leader: OTHER_LEADER,
          characters: [ID],
          hand: times(handSize, BLUE),
          costArea: { active: 0, rested: 3 },
        },
        { leader: PLAIN_BLUE },
      );

    it('with 5 or less cards in hand: set up to 1 DON!! as active, once per turn', () => {
      const g = board(5);
      const luffy = g.find('p1', 'characters', ID);
      g.act({ type: 'activate', card: luffy, ability: 'don-active' });
      setMost(g);
      expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
      expect(
        g.isLegal({ type: 'activate', card: luffy, ability: 'don-active', player: 'p1' }),
      ).toBe(false);
    });

    it('"up to 1": the player may set none (OP14-R2)', () => {
      const g = board(5);
      g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'don-active' });
      option(g, '0');
      expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    });

    it('with 6 cards in hand the ability cannot be activated', () => {
      const g = board(6);
      const luffy = g.find('p1', 'characters', ID);
      expect(
        g.isLegal({ type: 'activate', card: luffy, ability: 'don-active', player: 'p1' }),
      ).toBe(false);
      expectDecision(g, 'main', 'p1');
    });
  });
});
