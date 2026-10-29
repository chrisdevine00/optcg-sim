/**
 * Defeat, concession and the end of the game (rules digest §A items 2–7; CR 1-2, 9).
 * Leaders ST01-001 and ST04-001 (5000, [Activate: Main] only). Deck cards are vanilla fillers.
 */
import { describe, expect, it } from 'vitest';
import { reduce } from '@optcg/engine';
import { scenario } from '../../fixtures/index.ts';
import {
  act,
  attack,
  decision,
  endTurn,
  FILL,
  fill,
  L,
  noDefence,
  result,
  turn,
} from '../helpers.ts';

describe('defeat conditions (CR 1-2-1, 9-2)', () => {
  it('CR 1-2-1-1-1 / 9-2-1-1: a player with 0 Life whose Leader takes damage loses', () => {
    const g = scenario({
      p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
      p2: { leader: L.purpleKaido, life: [], deck: fill(FILL.purple, 10) },
    });
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(result(g)).toMatchObject({ winner: 'p1' });
    expect(decision(g)).toBeNull();
  });

  it('CR 1-2-1-1-2 / 9-2-1-2: drawing the last card of the deck loses at once', () => {
    const g = scenario({
      p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: [FILL.purple] },
    });
    endTurn(g);
    // p2 drew its last card in the Draw Phase; the game ends before p2's Main Phase.
    expect(g.zone('p2', 'deck')).toHaveLength(0);
    expect(g.zone('p2', 'hand')).toHaveLength(1);
    expect(result(g)).toMatchObject({ winner: 'p1' });
    expect(decision(g)).toBeNull();
    expect(g.legal()).toEqual([]);
  });

  it('CR 1-2-1-1-2: a deck that still has cards after the draw does not lose', () => {
    const g = scenario({
      p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 2) },
    });
    endTurn(g);
    expect(g.zone('p2', 'deck')).toHaveLength(1);
    expect(result(g)).toBeNull();
    expect(turn(g)).toMatchObject({ activePlayer: 'p2', phase: 'main' });
  });
});

describe('concession (CR 1-2-3)', () => {
  const g0 = () =>
    scenario({
      p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });

  it('CR 1-2-3: the deciding player may concede and loses immediately', () => {
    const g = g0();
    act(g, { type: 'concede' });
    expect(result(g)).toMatchObject({ winner: 'p2' });
    expect(decision(g)).toBeNull();
  });

  it('CR 1-2-3: a player may concede at any time, even when the other player is deciding', () => {
    const g = g0();
    expect(decision(g)?.player).toBe('p1');
    const step = reduce(g.state, { type: 'concede', player: 'p2' });
    expect(step.state).toBeDefined();
    g.state = step.state;
    expect(result(g)).toMatchObject({ winner: 'p1' });
  });

  it('CR 1-2-3: a player may concede in the middle of a battle', () => {
    const g = g0();
    attack(g, g.leader('p1'), g.leader('p2'));
    act(g, { type: 'concede' }); // p2 owes the Block Step decision
    expect(result(g)).toMatchObject({ winner: 'p1' });
  });
});

describe('effect-driven and simultaneous ends (need effects)', () => {
  it.todo('CR 1-2-4: no effect or replacement can prevent a concession (needs M4 effects)');
  it.todo(
    'CR 1-2-5: an effect that makes a player win or lose ends the game during resolution (needs M4 effects)',
  );
  it.todo(
    'CR 9-1-2: defeat is checked mid-resolution, e.g. a "draw 2" that empties the deck after 1 (needs M4 effects)',
  );
  it.todo('CR 1-3-2: "draw 2" with 1 card left draws 1 and then loses (needs M4 effects)');
  it.todo(
    'CR 9-2-1 [open-question Q4]: both players meeting a defeat condition at one check → result { draw: "bothLost" } (needs M4 effects or a scripted atomic op; no public API can empty both decks in one step)',
  );
  it.todo(
    'CR 1-3-10 / 9-1-2 [open-question Q5]: "each player draws 1" with 1 card each — the turn player draws first and loses before the other draws (needs M4 effects)',
  );
  it.todo(
    'CR 4-6-2 / 9-2-1-1 [open-question Q3]: effect damage of 2 at 1 Life — the second point at 0 Life defeats (needs M4 effects)',
  );
});
