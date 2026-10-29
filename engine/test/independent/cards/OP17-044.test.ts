/**
 * OP17-044 Captain John (Character, Blue, cost 4, 6000, no Counter, type Rocks Pirates).
 *
 * Card text (cards/data):
 *   "If your Leader's type includes "Rocks Pirates" and this Character is rested, your opponent
 *    cannot attack any card other than the Character [Captain John].
 *
 *    [Activate: Main] You may rest this Character: Draw 1 card and trash 1 card from your hand."
 *
 * Rules: the first paragraph is a permanent effect (CR 8-1-3-3), checked continuously. "Rest this
 * Character" is an activation cost; a rested card cannot pay it (CR 1-3-2-1, 8-3-1-3). Summoning
 * sickness only stops attacks (CR 3-7-4), not rest costs. [Captain John] is an exact name (CR 2-1-2).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, attackTargets, endTurn, fill, noDefence } from '../helpers.ts';
import {
  activate,
  BLUE,
  canActivate,
  choiceCards,
  choose,
  LEAD,
  myTurn,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit.ts';

function lock(p1: Partial<PlayerSpec>, leader: string = LEAD.rocks, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(
    side(leader, BLUE, p1),
    side(LEAD.luffy, RED, { characters: [VAN.thatch], ...p2 }),
  );
}

describe('OP17-044 Captain John: [Activate: Main] rest this: draw 1, trash 1', () => {
  it('happy path: John rests, p1 draws 1, then trashes 1 card of their choice (the drawn card is choosable)', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, {
        characters: [ROCKS.john],
        hand: [VAN.gordon],
        deck: [VAN.marco, ...fill(BLUE, 10)],
      }),
      side(LEAD.luffy, RED),
    );
    const john = g.find('p1', 'characters', ROCKS.john);
    expect(canActivate(g, john)).toBe(true);
    activate(g, john);
    expect(g.card(john).rested).toBe(true);
    expect(choiceCards(g)).toEqual([VAN.marco, VAN.gordon].sort());
    choose(g, [g.find('p1', 'hand', VAN.gordon)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.gordon]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('with an empty hand: draws 1 and must trash that card', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, { characters: [ROCKS.john], deck: [VAN.marco, ...fill(BLUE, 10)] }),
      side(LEAD.luffy, RED),
    );
    activate(g, g.find('p1', 'characters', ROCKS.john));
    if (choiceCards(g).length) choose(g, [g.find('p1', 'hand', VAN.marco)]);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.marco]);
  });

  it('CR 1-3-2-1 / 8-3-1-3: a rested John cannot pay "rest this Character", so it is not offered', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, { characters: [{ card: ROCKS.john, rested: true }] }),
      side(LEAD.luffy, RED),
    );
    expect(canActivate(g, g.find('p1', 'characters', ROCKS.john))).toBe(false);
  });

  it('CR 3-7-4: a John played this turn may still rest itself to activate', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, { characters: [{ card: ROCKS.john, playedThisTurn: true }] }),
      side(LEAD.luffy, RED),
    );
    expect(canActivate(g, g.find('p1', 'characters', ROCKS.john))).toBe(true);
  });

  it('no condition on the Leader: it works under a non-Rocks Leader (ST03-001 Crocodile)', () => {
    const g = myTurn(
      side(LEAD.crocodile, BLUE, { characters: [ROCKS.john], hand: [VAN.gordon] }),
      side(LEAD.luffy, RED),
    );
    expect(canActivate(g, g.find('p1', 'characters', ROCKS.john))).toBe(true);
  });

  it('CR 8-1-3-2: it is not offered on the opponent’s turn', () => {
    const g = lock({ characters: [ROCKS.john] });
    expect(canActivate(g, g.find('p1', 'characters', ROCKS.john))).toBe(false);
  });
});

describe('OP17-044 Captain John: rested John is the only legal attack target', () => {
  it('Rocks Leader + rested John: the opponent may attack only John (not the Leader, not other rested Characters)', () => {
    const g = lock({
      characters: [
        { card: ROCKS.john, rested: true },
        { card: VAN.mohji, rested: true },
      ],
    });
    const john = g.find('p1', 'characters', ROCKS.john);
    expect(attackTargets(g, g.leader('p2'))).toEqual([john]);
    expect(attackTargets(g, g.find('p2', 'characters', VAN.thatch))).toEqual([john]);
  });

  it('an active John does not apply: the Leader can be attacked (and the active John cannot)', () => {
    const g = lock({ characters: [ROCKS.john, { card: VAN.mohji, rested: true }] });
    expect(attackTargets(g, g.leader('p2'))).toEqual(
      [g.leader('p1'), g.find('p1', 'characters', VAN.mohji)].sort(),
    );
  });

  it('condition: under a non-Rocks Leader (ST03-001 Crocodile) a rested John does not restrict attacks', () => {
    const g = lock({ characters: [{ card: ROCKS.john, rested: true }] }, LEAD.crocodile);
    expect(attackTargets(g, g.leader('p2'))).toContain(g.leader('p1'));
  });

  it('CR 2-1-2: two rested Johns may both be attacked', () => {
    const g = lock({
      characters: [
        { card: ROCKS.john, rested: true },
        { card: ROCKS.john, rested: true },
      ],
    });
    expect(attackTargets(g, g.leader('p2'))).toEqual(
      [g.find('p1', 'characters', ROCKS.john, 0), g.find('p1', 'characters', ROCKS.john, 1)].sort(),
    );
  });

  it('interaction: activating John on p1’s turn leaves it rested, which locks p2’s attacks on p2’s turn', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, { characters: [ROCKS.john], hand: [VAN.gordon] }),
      side(LEAD.luffy, RED, { characters: [VAN.thatch] }),
    );
    const john = g.find('p1', 'characters', ROCKS.john);
    activate(g, john);
    if (choiceCards(g).length) choose(g, [g.find('p1', 'hand', VAN.gordon)]);
    endTurn(g);
    expect(attackTargets(g, g.leader('p2'))).toEqual([john]);
  });

  it('interaction: once John is K.O.’d in battle, the Leader can be attacked again', () => {
    // p2's OP02-007 Thatch (8000) attacks rested John (6000) and K.O.s it.
    const g = lock({ characters: [{ card: ROCKS.john, rested: true }] });
    const john = g.find('p1', 'characters', ROCKS.john);
    attack(g, g.find('p2', 'characters', VAN.thatch), john);
    noDefence(g);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.john]);
    expect(attackTargets(g, g.leader('p2'))).toEqual([g.leader('p1')]);
  });
});
