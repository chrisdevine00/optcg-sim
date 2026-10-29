/** OP17-044 Captain John. QA-OP17 OP17-044. */
import { describe, expect, it } from 'vitest';
import { whyNot } from '@optcg/engine';
import { BLUE, game, hand, pick, PLAIN_BLUE, PLAIN_PURPLE, ROCKS, trash, V } from './helpers.ts';

describe('OP17-044 Captain John', () => {
  const opponentTurn = (leader: string, rested: boolean) =>
    game(
      {
        leader,
        characters: [
          { card: 'OP17-044', rested },
          { card: 'OP17-045', rested: true },
        ],
      },
      { leader: PLAIN_PURPLE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );

  it('rested, with a Rocks Leader: the opponent can attack only Captain John', () => {
    const g = opponentTurn(ROCKS, true);
    const a = g.find('p2', 'characters', V.c6);
    const john = g.find('p1', 'characters', 'OP17-044');
    const targets = g
      .legal()
      .flatMap((x) => (x.type === 'attack' && x.attacker === a ? [x.target] : []));
    expect(targets).toEqual([john]);
    expect(
      whyNot(g.state, 'p2', { type: 'attack', attacker: a, target: g.leader('p1') })?.text,
    ).toMatch(/Captain John/);
  });

  it('active, or with another Leader, there is no lock', () => {
    for (const g of [opponentTurn(ROCKS, false), opponentTurn(PLAIN_BLUE, true)]) {
      const a = g.find('p2', 'characters', V.c6);
      const targets = g.legal().filter((x) => x.type === 'attack' && x.attacker === a);
      expect(targets.length).toBeGreaterThan(1);
    }
  });

  it('[Activate: Main] rests it: draw 1, then trash 1', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-044'], hand: ['OP17-045'], deck: [BLUE, BLUE] },
      { leader: PLAIN_PURPLE },
    );
    const john = g.find('p1', 'characters', 'OP17-044');
    g.act({ type: 'activate', card: john, ability: 'draw-trash' });
    expect(g.card(john).rested).toBe(true);
    pick(g, [g.find('p1', 'hand', 'OP17-045')]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(trash(g, 'p1')).toEqual(['OP17-045']);
    expect(g.isLegal({ type: 'activate', card: john, ability: 'draw-trash', player: 'p1' })).toBe(
      false,
    );
  });
});
