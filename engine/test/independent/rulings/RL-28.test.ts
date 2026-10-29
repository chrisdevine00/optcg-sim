/**
 * RL-28 First player's turn 1 and second player's turn 2.
 * rulings.md RL-28 (CR 6-3-1, 6-4-1, 6-5-6-1; Rule Manual p.11; QA-PRB01 PRB01-001; QA-ST32 ST32-005).
 *
 * The real-game part uses createGame with RED_DECK (50 red vanilla Characters). The scenario parts
 * use printed keywords: ST21-014 Monkey.D.Luffy ([Rush], 6000) and OP17-048 Shiki
 * ([Rush: Character], 9000), placed as played this turn so no [On Play] runs.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { attacks, don, endTurn, FILL, fill, isLegal, K, L, turn, V, why } from '../helpers.ts';
import { newGame, startKeepingHands } from '../setup-game.ts';

describe('RL-28: first turns', () => {
  it('RL-28: turn 1 (first player): hand stays 5, 1 DON!!, no attack; whyNot cites CR 6-5-6-1', () => {
    const g = newGame();
    startKeepingHands(g, true);
    expect(g.zone('p1', 'hand')).toHaveLength(5);
    expect(don(g, 'p1').active).toBe(1);
    expect(attacks(g)).toEqual([]);
    const reason = why(g, 'p1', {
      type: 'attack',
      attacker: g.leader('p1'),
      target: g.leader('p2'),
    });
    expect(reason?.rule).toContain('6-5-6-1');
  });

  it('RL-28: turn 2 (second player): hand 6, 2 DON!!, still no attack', () => {
    const g = newGame();
    startKeepingHands(g, true);
    endTurn(g);
    expect(g.zone('p2', 'hand')).toHaveLength(6);
    expect(don(g, 'p2').active).toBe(2);
    expect(attacks(g)).toEqual([]);
    const reason = why(g, 'p2', {
      type: 'attack',
      attacker: g.leader('p2'),
      target: g.leader('p1'),
    });
    expect(reason?.rule).toContain('6-5-6-1');
  });

  it('RL-28: turn 3 is the first battle of the game', () => {
    const g = newGame();
    startKeepingHands(g, true);
    endTurn(g);
    endTurn(g);
    expect(turn(g).number).toBe(3);
    expect(isLegal(g, { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') })).toBe(
      true,
    );
  });

  it('RL-28: on the second player’s first turn, even [Rush] and [Rush: Character] cannot attack', () => {
    const g = scenario({
      turn: 2,
      activePlayer: 'p2',
      firstPlayer: 'p1',
      p1: {
        leader: L.redLuffy,
        characters: [{ card: V.marco, rested: true }],
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: {
        leader: 'OP08-002', // Marco: Blue/Red Leader, 5000, 4 Life; [DON!! x1] [Activate: Main] only
        characters: [
          { card: K.rushLuffy, playedThisTurn: true },
          { card: K.rushCharShiki, playedThisTurn: true },
        ],
        costArea: { active: 2, rested: 0 },
        life: fill(FILL.red, 4),
        deck: fill(FILL.red, 10),
      },
    });
    expect(attacks(g)).toEqual([]);
  });

  it('RL-28: everything else is allowed on turn 1: playing a card and giving DON!!', () => {
    // OP01-010 Komachiyo: cost 1, vanilla.
    const g = scenario({
      turn: 1,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: L.redLuffy,
        hand: [V.komachiyo],
        costArea: { active: 1, rested: 0 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', V.komachiyo) })).toBe(true);
    expect(isLegal(g, { type: 'giveDon', target: g.leader('p1') })).toBe(true);
    expect(attacks(g)).toEqual([]);
  });

  it.todo(
    'RL-28 (QA-PRB01 PRB01-001): [Rush] granted by an effect on your first turn still cannot attack (needs M4 effects)',
  );
  it.todo(
    'RL-28 (QA-OP13 OP13-003): Roger’s DON!! Phase effect on the first turn (needs M4 effects)',
  );
  it.todo(
    'RL-28 (QA-OP15 OP15-058): "your second turn or later" effects cannot be used on your first turn (needs M4 effects)',
  );
});
