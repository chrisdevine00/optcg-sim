/** A [Trigger] ability's `conditions` are evaluated when it resolves (BACKLOG OP-13 g4). */
import { describe, expect, it } from 'vitest';
import { endCounter, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';
import { give } from '../support/game.ts';
import type { Ability } from '../../src/testing.ts';

const damaged = (conditions: unknown[]) => {
  const g = game(
    { leader: PLAIN_BLUE, life: [V.c1, V.c2] },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  give(g, V.c1, [
    {
      id: 'trig',
      kind: 'trigger',
      conditions,
      effect: [{ do: { draw: 1 } }],
    } as unknown as Ability,
  ]);
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  g.act({ type: 'trigger', activate: true });
  return g;
};

describe('[Trigger] conditions', () => {
  it('a true condition lets the effect resolve (the card is drawn)', () => {
    const g = damaged([{ opponentsTurn: true }]);
    // The damaged card was not added to hand (it was trashed after the trigger), so only the draw.
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });

  it('a false condition stops the effect: nothing is drawn', () => {
    const g = damaged([{ yourTurn: true }]);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });
});
