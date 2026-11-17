/**
 * OP01-055 You Can Be My Samurai!! (Event, Green, cost 1; Land of Wano / Kouzuki Clan).
 *
 * Card text (cards/data):
 *   "[Main] You may rest 2 of your Characters: Draw 2 cards."
 *
 * Rules: resting is a cost that needs active cards (CR 8-3-1-5): only active Characters can pay,
 * not the Leader, not already-rested Characters; a "may" cost can be declined and then nothing
 * happens (CR 8-3-1-4); the cost is exactly 2 Characters.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  CH,
  reachablePickSets,
  donOf,
  EV,
  F,
  LB,
  mainEvent,
  myTurn,
  side,
  sortedIds,
  zoneCards,
} from './kit-b.ts';

function game(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LB.greenKid, F.green, {
      hand: [EV.samurai],
      deck: [CH.marco, CH.sai, CH.kingdew, ...Array.from({ length: 10 }, () => F.green)],
      costArea: { active: 1, rested: 0 },
      characters: [CH.alvida, CH.bellamy3, CH.jeanBart4],
      ...p1,
    }),
    side(LB.opp, F.red),
  );
}

describe('OP01-055 [Main]: you may rest 2 of your Characters: draw 2 cards', () => {
  it('happy path: rest 2 of 3 Characters, draw the top 2 cards (Marco, Sai); the third Character and the Leader stay active', () => {
    const g = game();
    const a = g.find('p1', 'characters', CH.alvida);
    const b = g.find('p1', 'characters', CH.bellamy3);
    const c = g.find('p1', 'characters', CH.jeanBart4);
    mainEvent(g, g.find('p1', 'hand', EV.samurai), { cost: [a, b] });
    expect(g.card(a).rested).toBe(true);
    expect(g.card(b).rested).toBe(true);
    expect(g.card(c).rested).toBe(false);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([CH.marco, CH.sai].sort());
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(CH.kingdew);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.samurai]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
  });

  it('the player chooses which 2: any pair of the three active Characters can pay (the Leader cannot)', () => {
    const g = game();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.samurai) });
    act(g, { type: 'optional', accept: true });
    const pair = (a: string, b: string) => [a, b].sort().join('+');
    expect(reachablePickSets(g)).toEqual(
      new Set([
        pair(CH.alvida, CH.bellamy3),
        pair(CH.alvida, CH.jeanBart4),
        pair(CH.bellamy3, CH.jeanBart4),
      ]),
    );
  });

  it('CR 8-3-1-5: a rested Character cannot pay; with 1 active + 1 rested Character the cost cannot be paid: no draw', () => {
    const g = game({ characters: [CH.alvida, { card: CH.bellamy3, rested: true }] });
    const samurai = g.find('p1', 'hand', EV.samurai);
    if (g.isLegal({ type: 'playCard', card: samurai, player: 'p1' })) mainEvent(g, samurai);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([]);
    expect(g.card(g.find('p1', 'characters', CH.alvida)).rested).toBe(false);
  });

  it('with 2 active + 1 rested Characters the cost is payable only by the 2 active ones', () => {
    const g = game({ characters: [CH.alvida, CH.bellamy3, { card: CH.jeanBart4, rested: true }] });
    mainEvent(g, g.find('p1', 'hand', EV.samurai));
    expect(g.card(g.find('p1', 'characters', CH.alvida)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', CH.bellamy3)).rested).toBe(true);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([CH.marco, CH.sai].sort());
  });

  it('with 0 Characters the cost cannot be paid: no draw', () => {
    const g = game({ characters: [] });
    const samurai = g.find('p1', 'hand', EV.samurai);
    if (g.isLegal({ type: 'playCard', card: samurai, player: 'p1' })) mainEvent(g, samurai);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('CR 8-3-1-4: declining the cost: no Character is rested and nothing is drawn; the Event is still spent', () => {
    const g = game();
    mainEvent(g, g.find('p1', 'hand', EV.samurai), { use: [false] });
    expect(g.zone('p1', 'characters').every((c) => !c.rested)).toBe(true);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.samurai]);
  });

  it('draws exactly 2, not 1 and not 3', () => {
    const g = game();
    mainEvent(g, g.find('p1', 'hand', EV.samurai), {
      cost: [g.find('p1', 'characters', CH.alvida), g.find('p1', 'characters', CH.jeanBart4)],
    });
    expect(zoneCards(g, 'p1', 'hand')).toHaveLength(2);
    expect(zoneCards(g, 'p1', 'deck')).toHaveLength(11);
  });
});
