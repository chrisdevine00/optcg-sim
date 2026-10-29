/** CR 5-1-2 (deck construction) and CR 5-2-1 (pre-game procedure), rules-digest section F. */
import { describe, expect, it } from 'vitest';
import { createGame, InvalidSetup, queries, validateDeck, type DeckSpec } from '../../src/index.ts';
import { DefTable } from '../../src/defs.ts';
import { internals } from '../../src/testing.ts';
import { cards } from '../fixtures/index.ts';
import {
  ENEL,
  give,
  KAIDO,
  LUFFY,
  newGame,
  PUR_1,
  RED_1,
  STAGE_RED,
  times,
  types,
  vanillaDeck,
} from '../support/game.ts';

const check = (deck: DeckSpec): string[] => validateDeck(deck, new DefTable(cards()));

describe('deck construction (CR 5-1-2)', () => {
  it('CR 5-1-2: a legal deck has 1 Leader and exactly 50 cards', () => {
    expect(check({ leader: LUFFY, main: vanillaDeck('Red') })).toEqual([]);
    expect(check({ leader: LUFFY, main: vanillaDeck('Red').slice(1) }).join()).toMatch(/49 cards/);
    expect(check({ leader: RED_1, main: vanillaDeck('Red') }).join()).toMatch(/not a Leader/);
  });

  it('CR 5-1-2-1: a Leader in the main deck is rejected', () => {
    const main = [...vanillaDeck('Red').slice(0, 49), LUFFY];
    expect(check({ leader: LUFFY, main }).join()).toMatch(/CR 5-1-2-1/);
  });

  it('CR 5-1-2-2: a card with a color the Leader lacks is rejected (multicolor too)', () => {
    const main = [...vanillaDeck('Red').slice(0, 49), PUR_1];
    expect(check({ leader: LUFFY, main }).join()).toMatch(/CR 5-1-2-2/);
    // Rosinante OP12-061 is Purple/Yellow: a purple card is fine, a red one is not.
    const mixed = [...vanillaDeck('Purple').slice(0, 49), RED_1];
    expect(check({ leader: 'OP12-061', main: vanillaDeck('Purple') })).toEqual([]);
    expect(check({ leader: 'OP12-061', main: mixed }).join()).toMatch(/CR 5-1-2-2/);
  });

  it('CR 2-14-2 / 5-1-2-3: more than 4 copies of a card number is rejected', () => {
    const main = [...vanillaDeck('Red').slice(0, 45), ...times(5, RED_1)];
    expect(check({ leader: LUFFY, main }).join()).toMatch(
      /copies of EB01-005; the limit is 4 per card number/,
    );
  });

  it('createGame validates both decks again at game start', () => {
    expect(() =>
      createGame({
        seed: 1,
        cards: cards(),
        decks: {
          p1: { leader: LUFFY, main: vanillaDeck('Red').slice(3) },
          p2: { leader: KAIDO, main: vanillaDeck('Purple') },
        },
      }),
    ).toThrow(InvalidSetup);
  });

  it('a Stage is a legal deck card (CR 5-1-2-1)', () => {
    const main = [...vanillaDeck('Red').slice(0, 46), ...times(4, STAGE_RED)];
    expect(check({ leader: LUFFY, main })).toEqual([]);
  });
});

describe('pre-game procedure (CR 5-2-1)', () => {
  it('CR 5-2-1-4 / 5-2-1-5: the chooser decides first or second, and may choose second', () => {
    const g = newGame(3, 'p2');
    expect(queries.decision(g.state)).toMatchObject({ kind: 'chooseFirst', player: 'p2' });
    g.act({ type: 'chooseFirst', goFirst: false });
    expect(queries.decision(g.state)).toMatchObject({ kind: 'mulligan', player: 'p1' });
    expect(internals(g.state).first).toBe('p1');
  });

  it('CR 5-2-1-4: with no chooser given, the seed picks one', () => {
    const a = createGame({
      seed: 11,
      cards: cards(),
      decks: {
        p1: { leader: LUFFY, main: vanillaDeck('Red') },
        p2: { leader: KAIDO, main: vanillaDeck('Purple') },
      },
    });
    const b = createGame({
      seed: 11,
      cards: cards(),
      decks: {
        p1: { leader: LUFFY, main: vanillaDeck('Red') },
        p2: { leader: KAIDO, main: vanillaDeck('Purple') },
      },
    });
    expect(queries.decision(a.state)!.player).toBe(queries.decision(b.state)!.player);
  });

  it('CR 5-2-1-2 / 5-2-1-3: decks are shuffled and Leaders placed face up before the choice', () => {
    const g = newGame(5);
    expect(g.zone('p1', 'deck')).toHaveLength(50);
    expect(g.zone('p1', 'leader')[0]).toMatchObject({ card: LUFFY, faceUp: true });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    const order = g.zone('p1', 'deck').map((c) => c.card);
    expect(order).not.toEqual(vanillaDeck('Red'));
  });

  it('CR 5-2-1-5-1: start-of-game effects run after the choice, chooser first, before hands (RL-30)', () => {
    const g = newGame(5, 'p2');
    give(g, LUFFY, [
      {
        id: 'sog',
        kind: 'auto',
        when: ['startOfGame'],
        effect: [{ op: 'emit', label: 'p1-start' }],
      },
    ]);
    give(g, KAIDO, [
      {
        id: 'sog',
        kind: 'auto',
        when: ['startOfGame'],
        effect: [{ op: 'emit', label: 'p2-start' }],
      },
    ]);
    const ev = g.act({ type: 'chooseFirst', goFirst: false }); // p2 chooses, goes second
    const labels = ev.filter((e) => e.type === 'EffectResolved').map((e) => e.label);
    // @ruling-conflict RL-30: the CR says the chooser (p2) first; QA-OP13 says the first player.
    expect(labels).toEqual(['p2-start', 'p1-start']);
    const firstDraw = ev.findIndex((e) => e.type === 'CardMoved' && e.reason === 'draw');
    const lastEffect = ev.findLastIndex((e) => e.type === 'EffectResolved');
    expect(lastEffect).toBeLessThan(firstDraw);
  });

  it('CR 5-2-1-6: each player draws 5; the first player decides on a redraw first', () => {
    const g = newGame(9, 'p1');
    g.act({ type: 'chooseFirst', goFirst: false }); // p2 goes first
    expect(g.zone('p1', 'hand')).toHaveLength(5);
    expect(g.zone('p2', 'hand')).toHaveLength(5);
    expect(queries.decision(g.state)).toMatchObject({ kind: 'mulligan', player: 'p2' });
    g.act({ type: 'mulligan', redraw: false });
    expect(queries.decision(g.state)).toMatchObject({ kind: 'mulligan', player: 'p1' });
  });

  it('CR 5-2-1-6-1: one redraw, all or nothing: the hand returns, the deck is shuffled, 5 are drawn', () => {
    const g = newGame(9, 'p1');
    g.act({ type: 'chooseFirst', goFirst: true });
    const before = g.zone('p1', 'hand').map((c) => c.instance);
    const ev = g.act({ type: 'mulligan', redraw: true });
    expect(types(ev)).toContain('Shuffled');
    expect(ev.filter((e) => e.type === 'CardMoved' && e.to === 'deck')).toHaveLength(5);
    expect(g.zone('p1', 'hand')).toHaveLength(5);
    expect(g.zone('p1', 'deck')).toHaveLength(45);
    // No second redraw for p1: the next decision is p2's.
    expect(queries.decision(g.state)).toMatchObject({ kind: 'mulligan', player: 'p2' });
    expect(before).toHaveLength(5);
  });

  it('CR 5-2-1-7 / 2-9-2-1: Life is placed after both redraws, the deck top ending at the bottom', () => {
    const g = newGame(13, 'p1');
    g.act({ type: 'chooseFirst', goFirst: true });
    g.act({ type: 'mulligan', redraw: false });
    expect(g.zone('p1', 'life')).toHaveLength(0); // not yet: p2 has not decided
    const deckTop = g
      .zone('p1', 'deck')
      .slice(0, 5)
      .map((c) => c.instance);
    g.act({ type: 'mulligan', redraw: false });
    const life = g.zone('p1', 'life');
    expect(life.map((c) => c.instance)).toEqual(deckTop.slice().reverse());
    expect(life.every((c) => !c.faceUp)).toBe(true);
    expect(g.zone('p2', 'life')).toHaveLength(5); // Kaido ST04-001 has 5 Life
    expect(g.zone('p1', 'deck')).toHaveLength(40);
  });

  it('CR 5-2-1-8: the first player then starts turn 1 at their Main Phase', () => {
    const g = newGame(13, 'p1');
    g.act({ type: 'chooseFirst', goFirst: true });
    g.act({ type: 'mulligan', redraw: false });
    g.act({ type: 'mulligan', redraw: false });
    expect(queries.turn(g.state)).toEqual({
      number: 1,
      activePlayer: 'p1',
      phase: 'main',
      battleStep: null,
    });
  });

  it('RL-40 / CR 5-1-2-4: OP15-058 Enel has a 6-card DON!! deck and invariants use 6', () => {
    const main = vanillaDeck('Purple');
    const step = createGame({
      seed: 2,
      cards: cards(),
      chooser: 'p1',
      decks: { p1: { leader: ENEL, main }, p2: { leader: KAIDO, main } },
    });
    expect(queries.don(step.state, 'p1').deck).toBe(6);
    expect(queries.don(step.state, 'p2').deck).toBe(10);
    expect(internals(step.state).setup.donSize).toEqual({ p1: 6, p2: 10 });
  });
});
