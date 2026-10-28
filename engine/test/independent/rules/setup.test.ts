/**
 * Pre-game setup and deck construction (rules digest §C, §F; CR 5-1, 5-2).
 * Cards: RED_DECK (setup-game.ts) is 50 red vanilla Characters. Leaders: ST01-001 (Red, 5 Life)
 * for p1 and OP01-002 (Green/Red, 4 Life) for p2, so Life placement shows each Leader's own value.
 */
import { describe, expect, it } from 'vitest';
import { createGame, type CardId } from '@optcg/engine';
import { cards } from '../../fixtures/index.ts';
import { act, decision, don, ids, isLegal, turn } from '../helpers.ts';
import { newGame, RED_DECK, startKeepingHands } from '../setup-game.ts';

const sorted = (xs: CardId[]) => [...xs].sort();

describe('deck construction (CR 5-1-2)', () => {
  const start = (p1Main: CardId[], p1Leader = 'ST01-001') =>
    createGame({
      seed: 1,
      cards: cards(),
      chooser: 'p1',
      decks: { p1: { leader: p1Leader, main: p1Main }, p2: { leader: 'ST01-001', main: RED_DECK } },
    });

  it('CR 5-1-2: a legal 50-card deck starts a game', () => {
    expect(() => start(RED_DECK)).not.toThrow();
  });

  it('CR 5-1-2: a deck of 49 or 51 cards is rejected', () => {
    expect(() => start(RED_DECK.slice(0, 49))).toThrow();
    // A 3rd OP02-020 keeps every card number within 4 copies; only the count is wrong.
    expect(() => start([...RED_DECK, 'OP02-020'])).toThrow();
  });

  it('CR 5-1-2-1: a Leader card in the main deck is rejected', () => {
    // ST01-001 is a Leader; it replaces one OP02-020 to keep the count at 50.
    expect(() => start([...RED_DECK.slice(0, 49), 'ST01-001'])).toThrow();
  });

  it('CR 5-1-2-2: a card with a color the Leader lacks is rejected', () => {
    // OP02-084 Blugori is Purple; the Leader ST01-001 is Red only.
    expect(() => start([...RED_DECK.slice(0, 49), 'OP02-084'])).toThrow();
  });

  it('CR 2-14-2 / 5-1-2-3: five copies of one card number are rejected', () => {
    // RED_DECK's first 45 cards hold no OP02-020; adding 5 copies keeps the count at 50.
    const five = [...RED_DECK.slice(0, 45), ...Array<CardId>(5).fill('OP02-020')];
    expect(five).toHaveLength(50);
    expect(five.filter((c) => c === 'OP02-020')).toHaveLength(5);
    expect(() => start(five)).toThrow();
  });
});

describe('pre-game procedure (CR 5-2-1)', () => {
  it('CR 5-2-1-4 / 5-2-1-5: the player who won the choice decides to go first or second', () => {
    const g = newGame({ chooser: 'p2' });
    expect(decision(g)).toMatchObject({ kind: 'chooseFirst', player: 'p2' });
    expect(isLegal(g, { type: 'chooseFirst', goFirst: true, player: 'p1' })).toBe(false);
  });

  it('CR 5-2-1-5 / 5-2-1-8: the chooser may go second, and the first player takes turn 1', () => {
    const g = newGame({ chooser: 'p2' });
    startKeepingHands(g, false);
    expect(turn(g)).toMatchObject({ number: 1, activePlayer: 'p1', phase: 'main' });
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
  });

  it('CR 5-2-1-5 / 5-2-1-8: the chooser may go first', () => {
    const g = newGame({ chooser: 'p2' });
    startKeepingHands(g, true);
    expect(turn(g)).toMatchObject({ number: 1, activePlayer: 'p2', phase: 'main' });
  });

  it('CR 5-2-1-6: each player draws 5 cards before any redraw decision; no Life yet', () => {
    const g = newGame();
    act(g, { type: 'chooseFirst', goFirst: true });
    expect(decision(g)?.kind).toBe('mulligan');
    for (const p of ['p1', 'p2'] as const) {
      expect(g.zone(p, 'hand')).toHaveLength(5);
      expect(g.zone(p, 'deck')).toHaveLength(45);
      expect(g.life(p)).toBe(0);
    }
  });

  it('CR 5-2-1-6: the player going first decides on a redraw first, then the other player', () => {
    // p1 chooses and goes second, so p2 is first and must decide first.
    const g = newGame({ chooser: 'p1' });
    act(g, { type: 'chooseFirst', goFirst: false });
    expect(decision(g)).toMatchObject({ kind: 'mulligan', player: 'p2' });
    act(g, { type: 'mulligan', redraw: false });
    expect(decision(g)).toMatchObject({ kind: 'mulligan', player: 'p1' });
    act(g, { type: 'mulligan', redraw: false });
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p2' });
  });

  it('CR 5-2-1-6-1: a redraw returns the whole hand, reshuffles and draws 5; at most once', () => {
    const g = newGame();
    act(g, { type: 'chooseFirst', goFirst: true });
    act(g, { type: 'mulligan', redraw: true });
    expect(g.zone('p1', 'hand')).toHaveLength(5);
    expect(g.zone('p1', 'deck')).toHaveLength(45);
    const all = [...g.zone('p1', 'hand'), ...g.zone('p1', 'deck')].map((c) => c.card);
    expect(sorted(all)).toEqual(sorted(RED_DECK));
    // No second redraw for p1: the next decision is p2's.
    expect(decision(g)).toMatchObject({ kind: 'mulligan', player: 'p2' });
  });

  it('CR 5-2-1-7: Life is placed only after both redraw decisions, equal to each Leader’s Life', () => {
    const g = newGame();
    act(g, { type: 'chooseFirst', goFirst: true });
    act(g, { type: 'mulligan', redraw: false });
    expect(g.life('p1')).toBe(0);
    expect(g.life('p2')).toBe(0);
    act(g, { type: 'mulligan', redraw: false });
    expect(g.life('p1')).toBe(5); // ST01-001: 5 Life
    expect(g.life('p2')).toBe(4); // OP01-002: 4 Life
  });

  it('CR 5-2-1-7 / 2-9-2-1: the deck’s top card ends at the bottom of Life, face down', () => {
    const g = newGame();
    act(g, { type: 'chooseFirst', goFirst: true });
    act(g, { type: 'mulligan', redraw: true });
    // Both decks are final now: p1 has redrawn, p2 is about to keep.
    const p1Deck = ids(g, 'p1', 'deck');
    const p2Deck = ids(g, 'p2', 'deck');
    act(g, { type: 'mulligan', redraw: false });

    expect(ids(g, 'p1', 'life')).toEqual(p1Deck.slice(0, 5).reverse());
    expect(ids(g, 'p2', 'life')).toEqual(p2Deck.slice(0, 4).reverse());
    expect(ids(g, 'p1', 'deck')).toEqual(p1Deck.slice(5));
    expect(ids(g, 'p2', 'deck')).toEqual(p2Deck.slice(4));
    for (const p of ['p1', 'p2'] as const) {
      for (const c of g.zone(p, 'life')) expect(c.faceUp).toBe(false);
    }
  });

  it('CR 5-2-1-3: each Leader starts face up and active in the Leader area', () => {
    const g = newGame();
    startKeepingHands(g);
    for (const p of ['p1', 'p2'] as const) {
      const [leader] = g.zone(p, 'leader');
      expect(leader).toMatchObject({ faceUp: true, rested: false, don: 0 });
    }
    expect(g.zone('p1', 'leader')[0]!.card).toBe('ST01-001');
    expect(g.zone('p2', 'leader')[0]!.card).toBe('OP01-002');
  });

  it('CR 5-1-2: each player starts with a 10-card DON!! deck', () => {
    const g = newGame();
    act(g, { type: 'chooseFirst', goFirst: true });
    expect(don(g, 'p1')).toEqual({ deck: 10, active: 0, rested: 0, given: 0 });
    expect(don(g, 'p2')).toEqual({ deck: 10, active: 0, rested: 0, given: 0 });
  });
});
