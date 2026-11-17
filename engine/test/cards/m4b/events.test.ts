/**
 * M4b wave 1: event-triggered autos (effect-dsl.md §4.2): cardPlayed, eventActivated,
 * blockerActivated, lifeRemoved, lifeBecameZero, koed. Planted on vanilla cards; each watcher draws a
 * card, so "it fired" is "the watcher's owner has one more card in hand".
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, withKeywords, type Ability } from '../../../src/testing.ts';
import type { AutoTiming } from '@optcg/cards';
import { BLUE, game, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';

const EVENT = 'OP15-074';

const watcher = (when: AutoTiming, id = 'w'): Ability => ({
  id,
  kind: 'auto',
  when: [when],
  effect: [{ do: { draw: 1 } }],
});

describe('cardPlayed', () => {
  const play = (when: AutoTiming) => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [V.c1], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, PLAIN_PURPLE, [watcher(when)]);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c1) });
    return g.zone('p1', 'hand').length;
  };

  it('"when you play a Character" fires on your own play, filtered by the card', () => {
    expect(play({ event: 'cardPlayed', by: 'you', filter: { category: ['Character'] } })).toBe(1);
    expect(play({ event: 'cardPlayed', by: 'you', filter: { category: ['Event'] } })).toBe(0);
    expect(play({ event: 'cardPlayed', by: 'opponent' })).toBe(0);
  });

  it('"when your opponent plays" fires on the other player\'s play', () => {
    const g = game(
      { leader: PLAIN_PURPLE },
      { leader: PLAIN_BLUE, hand: [V.c1], costArea: { active: 1, rested: 0 } },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, PLAIN_PURPLE, [
      watcher({ event: 'cardPlayed', by: 'opponent' }),
    ]);
    g.act({ type: 'playCard', card: g.find('p2', 'hand', V.c1) });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });
});

describe('eventActivated and blockerActivated', () => {
  it('"when your opponent activates an Event" fires on their Event, not on yours', () => {
    const run = (activePlayer: 'p1' | 'p2') => {
      const g = game(
        { leader: PLAIN_PURPLE, hand: activePlayer === 'p1' ? [EVENT] : [] },
        { leader: PLAIN_BLUE, hand: activePlayer === 'p2' ? [EVENT] : [] },
        { activePlayer, turn: activePlayer === 'p1' ? 3 : 4 },
      );
      g.state = withAbilities(g.state, EVENT, [
        { id: 'm', kind: 'activate', when: 'main', effect: [] },
      ]);
      g.state = withAbilities(g.state, PLAIN_PURPLE, [
        watcher({ event: 'eventActivated', by: 'opponent' }),
      ]);
      g.act({ type: 'playCard', card: g.find(activePlayer, 'hand', EVENT) });
      return g.zone('p1', 'hand').length;
    };
    expect(run('p2')).toBe(1);
    expect(run('p1')).toBe(0);
  });

  it('"when your opponent activates [Blocker]" fires when the defender blocks', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c2] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withKeywords(g.state, BLUE, ['Blocker']);
    g.state = withAbilities(g.state, PLAIN_BLUE, [
      watcher({ event: 'blockerActivated', by: 'opponent' }),
    ]);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c2), target: g.leader('p1') });
    g.act({ type: 'block', blocker: g.find('p1', 'characters', BLUE) });
    expect(g.zone('p2', 'hand')).toHaveLength(1);
  });
});

describe('Life events and K.O.', () => {
  const lifeGame = (life: number, owner: 'you' | 'opponent' | 'any', zero?: boolean) => {
    const g = game(
      { leader: PLAIN_PURPLE },
      { leader: PLAIN_BLUE, life: Array.from({ length: life }, () => BLUE) },
    );
    g.state = withAbilities(g.state, PLAIN_PURPLE, [
      watcher(
        zero
          ? { event: 'lifeBecameZero', owner: owner as 'opponent' }
          : { event: 'lifeRemoved', owner },
      ),
    ]);
    const r = applyOp(g.state, { op: 'lifeToHand', player: 'p2', n: 1 });
    g.state = r.state;
    return g.zone('p1', 'hand').length;
  };

  it('lifeRemoved fires for any owner when a Life card leaves, and respects "you" and "opponent"', () => {
    expect(lifeGame(3, 'any')).toBe(1);
    expect(lifeGame(3, 'opponent')).toBe(1);
    expect(lifeGame(3, 'you')).toBe(0);
  });

  it('lifeBecameZero fires only when the removal leaves 0 Life cards (CR 1-2-1-1-1 context)', () => {
    expect(lifeGame(2, 'opponent', true)).toBe(0);
    expect(lifeGame(1, 'opponent', true)).toBe(1);
  });

  it('"when one of your Characters is K.O.\'d" filters the K.O.\'d card by its base power', () => {
    const ko = (card: string) => {
      const g = game({ leader: PLAIN_PURPLE, characters: [card] }, { leader: PLAIN_BLUE });
      g.state = withAbilities(g.state, PLAIN_PURPLE, [
        watcher({ event: 'koed', filter: { basePower: { gte: 5000 } } }),
      ]);
      g.state = applyOp(g.state, {
        op: 'ko',
        card: g.find('p1', 'characters', card),
        by: 'p2',
      }).state;
      return g.zone('p1', 'hand').length;
    };
    expect(ko(V.c3)).toBe(1);
    expect(ko(V.c1)).toBe(0);
  });
});
