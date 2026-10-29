/**
 * Turn structure: Refresh, Draw, DON!!, Main and End (rules digest §G; CR 6).
 * Leaders ST01-001 (Red) and ST04-001 (Purple) carry only an [Activate: Main], so no effect fires.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { attacks, decision, don, endTurn, FILL, fill, L, S, turn, V, why } from '../helpers.ts';
import { newGame, startKeepingHands } from '../setup-game.ts';

describe('first turns (CR 6-3-1, 6-4-1, 6-5-6-1)', () => {
  it('CR 6-3-1: the first player does not draw on turn 1', () => {
    const g = newGame();
    startKeepingHands(g, true);
    expect(turn(g)).toMatchObject({ number: 1, activePlayer: 'p1', phase: 'main' });
    expect(g.zone('p1', 'hand')).toHaveLength(5);
    expect(g.zone('p1', 'deck')).toHaveLength(40); // 50 - 5 hand - 5 Life
  });

  it('CR 6-4-1: the first player places only 1 DON!! on turn 1', () => {
    const g = newGame();
    startKeepingHands(g, true);
    expect(don(g, 'p1')).toEqual({ deck: 9, active: 1, rested: 0, given: 0 });
  });

  it('CR 6-3-1 / 6-4-1: the second player draws 1 and places 2 DON!! on turn 2', () => {
    const g = newGame();
    startKeepingHands(g, true);
    endTurn(g);
    expect(turn(g)).toMatchObject({ number: 2, activePlayer: 'p2', phase: 'main' });
    expect(g.zone('p2', 'hand')).toHaveLength(6);
    expect(g.zone('p2', 'deck')).toHaveLength(40); // 50 - 5 hand - 4 Life - 1 draw
    expect(don(g, 'p2')).toEqual({ deck: 8, active: 2, rested: 0, given: 0 });
  });

  it('CR 6-5-6-1: neither player can battle on their own first turn (turns 1 and 2); turn 3 can', () => {
    const g = newGame();
    startKeepingHands(g, true);
    expect(attacks(g)).toEqual([]);
    const p1Leader = g.leader('p1');
    const p2Leader = g.leader('p2');
    expect(why(g, 'p1', { type: 'attack', attacker: p1Leader, target: p2Leader })).not.toBeNull();

    endTurn(g);
    expect(turn(g).number).toBe(2);
    expect(attacks(g)).toEqual([]);
    expect(why(g, 'p2', { type: 'attack', attacker: p2Leader, target: p1Leader })).not.toBeNull();

    endTurn(g);
    expect(turn(g)).toMatchObject({ number: 3, activePlayer: 'p1' });
    expect(attacks(g)).toContainEqual(
      expect.objectContaining({ type: 'attack', attacker: p1Leader, target: p2Leader }),
    );
  });

  it('CR 6-3-1: from turn 3 on, the first player draws 1 and places 2 DON!!', () => {
    const g = newGame();
    startKeepingHands(g, true);
    endTurn(g);
    endTurn(g);
    expect(g.zone('p1', 'hand')).toHaveLength(6);
    expect(don(g, 'p1')).toEqual({ deck: 7, active: 3, rested: 0, given: 0 });
  });
});

describe('Refresh Phase (CR 6-2)', () => {
  // p1 (turn player, turn 3): Leader rested with 1 DON!!, OP01-023 Marco rested with 2 DON!!,
  // OP01-012 Sai rested, Stage OP05-021 rested, 3 rested DON!! in the cost area, DON!! deck 4.
  const refreshScenario = () =>
    scenario({
      p1: {
        leader: { card: L.redLuffy, rested: true, don: 1 },
        characters: [
          { card: V.marco, rested: true, don: 2 },
          { card: V.sai, rested: true },
        ],
        stage: { card: S.armyHq, rested: true },
        costArea: { active: 0, rested: 3 },
        donDeck: 4,
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });

  it('CR 6-2-3 / 6-2-4: only the turn player refreshes; the opponent’s cards stay as they are', () => {
    const g = refreshScenario();
    endTurn(g);
    expect(turn(g)).toMatchObject({ number: 4, activePlayer: 'p2' });
    // p1 is not the turn player: nothing of p1's is returned or set active.
    expect(g.card(g.leader('p1'))).toMatchObject({ rested: true, don: 1 });
    expect(g.card(g.find('p1', 'characters', V.marco))).toMatchObject({ rested: true, don: 2 });
    expect(g.card(g.find('p1', 'characters', V.sai)).rested).toBe(true);
    expect(don(g, 'p1')).toEqual({ deck: 4, active: 0, rested: 3, given: 3 });
  });

  it('CR 6-2-3 / 6-2-4: given DON!! return to the cost area, then all rested cards become active', () => {
    const g = refreshScenario();
    endTurn(g);
    endTurn(g);
    expect(turn(g)).toMatchObject({ number: 5, activePlayer: 'p1', phase: 'main' });
    expect(g.card(g.leader('p1'))).toMatchObject({ rested: false, don: 0 });
    expect(g.card(g.find('p1', 'characters', V.marco))).toMatchObject({ rested: false, don: 0 });
    expect(g.card(g.find('p1', 'characters', V.sai)).rested).toBe(false);
    expect(g.card(g.find('p1', 'stage', S.armyHq)).rested).toBe(false);
    // 3 returned + 3 already in the cost area, all set active; then 2 placed in the DON!! Phase.
    expect(don(g, 'p1')).toEqual({ deck: 2, active: 8, rested: 0, given: 0 });
  });
});

describe('Draw and DON!! Phases (CR 6-3, 6-4)', () => {
  const p1 = { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) };

  it('CR 6-3-1: the turn player draws the top card of their deck', () => {
    const g = scenario({
      p1,
      p2: {
        leader: L.purpleKaido,
        life: fill(FILL.purple, 5),
        deck: [V.urashima, ...fill(FILL.purple, 9)],
      },
    });
    expect(g.zone('p2', 'deck')[0]!.card).toBe(V.urashima);
    endTurn(g);
    expect(g.zone('p2', 'hand').map((c) => c.card)).toEqual([V.urashima]);
    expect(g.zone('p2', 'deck')).toHaveLength(9);
  });

  it('CR 6-4-2: with 1 card in the DON!! deck, only 1 DON!! is placed', () => {
    const g = scenario({
      p1,
      p2: {
        leader: L.purpleKaido,
        life: fill(FILL.purple, 5),
        deck: fill(FILL.purple, 10),
        costArea: { active: 9, rested: 0 },
        donDeck: 1,
      },
    });
    endTurn(g);
    expect(don(g, 'p2')).toEqual({ deck: 0, active: 10, rested: 0, given: 0 });
  });

  it('CR 6-4-3: with an empty DON!! deck, no DON!! is placed', () => {
    const g = scenario({
      p1,
      p2: {
        leader: L.purpleKaido,
        life: fill(FILL.purple, 5),
        deck: fill(FILL.purple, 10),
        costArea: { active: 4, rested: 6 },
        donDeck: 0,
      },
    });
    endTurn(g);
    expect(don(g, 'p2')).toEqual({ deck: 0, active: 10, rested: 0, given: 0 });
  });
});

describe('Main and End Phases (CR 6-5, 6-6)', () => {
  it('CR 6-6-1-4: ending the turn passes it to the other player, who gets the Main Phase', () => {
    const g = scenario({
      p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
    endTurn(g);
    expect(turn(g)).toMatchObject({
      number: 4,
      activePlayer: 'p2',
      phase: 'main',
      battleStep: null,
    });
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p2' });
  });

  it('QA-GR "no hand limit": a player keeps any number of cards in hand at the end of the turn', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        hand: fill(V.komachiyo, 4).concat(fill(V.sai, 4), fill(V.marco, 4)),
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });
    endTurn(g);
    expect(g.zone('p1', 'hand')).toHaveLength(12);
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p2' });
  });

  it('CR 6-5-2: only the turn player acts in the Main Phase', () => {
    const g = scenario({
      p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
      p2: {
        leader: L.purpleKaido,
        hand: [V.blugori],
        costArea: { active: 3, rested: 0 },
        life: fill(FILL.purple, 5),
        deck: fill(FILL.purple, 10),
      },
    });
    expect(g.legal().every((a) => a.player === 'p1')).toBe(true);
  });
});
