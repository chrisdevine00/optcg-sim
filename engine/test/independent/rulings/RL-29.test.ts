/**
 * RL-29 Mulligan (redraw) procedure.
 * rulings.md RL-29 (CR 5-2-1-6, 5-2-1-6-1, 5-2-1-7, 2-9-2-1; Rule Manual p.7; QA-GR Life order).
 *
 * createGame with RED_DECK (50 red vanilla Characters); p1 Leader ST01-001 (5 Life), p2 Leader
 * OP01-002 (4 Life). p1 wins the choice and goes first.
 */
import { describe, expect, it } from 'vitest';
import { act, decision, ids } from '../helpers.ts';
import { newGame, RED_DECK } from '../setup-game.ts';

describe('RL-29: mulligan', () => {
  it('RL-29: the first player decides first; a redraw is 5 cards from the reshuffled 50; no second redraw', () => {
    const g = newGame({ chooser: 'p1' });
    act(g, { type: 'chooseFirst', goFirst: true });
    expect(decision(g)).toMatchObject({ kind: 'mulligan', player: 'p1' });
    act(g, { type: 'mulligan', redraw: true });
    expect(g.zone('p1', 'hand')).toHaveLength(5);
    const fifty = [...g.zone('p1', 'hand'), ...g.zone('p1', 'deck')].map((c) => c.card).sort();
    expect(fifty).toEqual([...RED_DECK].sort());
    expect(decision(g)).toMatchObject({ kind: 'mulligan', player: 'p2' });
  });

  it('RL-29: the second player decides after seeing the first player’s choice', () => {
    const g = newGame({ chooser: 'p1' });
    act(g, { type: 'chooseFirst', goFirst: true });
    act(g, { type: 'mulligan', redraw: false });
    expect(decision(g)).toMatchObject({ kind: 'mulligan', player: 'p2' });
    act(g, { type: 'mulligan', redraw: true });
    expect(g.zone('p2', 'hand')).toHaveLength(5);
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
  });

  it('RL-29: Life is placed after both decisions; Life[bottom] is the deck top at that moment', () => {
    const g = newGame({ chooser: 'p1' });
    act(g, { type: 'chooseFirst', goFirst: true });
    act(g, { type: 'mulligan', redraw: false });
    expect(g.life('p1')).toBe(0);
    act(g, { type: 'mulligan', redraw: true });
    // p2 has just redrawn: Life must come from p2's reshuffled deck.
    const p1Life = ids(g, 'p1', 'life');
    const p2Life = ids(g, 'p2', 'life');
    expect(p1Life).toHaveLength(5);
    expect(p2Life).toHaveLength(4);
    // None of the Life cards is in a hand.
    const hands = new Set([...ids(g, 'p1', 'hand'), ...ids(g, 'p2', 'hand')]);
    for (const id of [...p1Life, ...p2Life]) expect(hands.has(id)).toBe(false);
  });
});
