/**
 * OP17-046 Gloriosa (Character, Blue, cost 4, 1000, no Counter, types Amazon Lily / Rocks Pirates).
 *
 * Card text (cards/data):
 *   "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new
 *    target of the attack.)
 *    [On Play] Place up to 1 Character with a cost of 5 or less at the bottom of the owner's deck."
 *
 * Rules: "Character" means any Character in a Character area, either player's (CR 2-2-4-1). Placing
 * in the deck is not a K.O. (CR 10-2-1-3; RL-15). DON!! given to a card that leaves go to the cost
 * area rested (CR 6-5-5-4). Up to 1 allows 0 (CR 8-4-4-1).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, blockers, decision, play } from '../helpers.ts';
import {
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  donOf,
  LEAD,
  myTurn,
  RED,
  ROCKS,
  side,
  theirTurn,
  VAN,
} from './kit.ts';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LEAD.rocks, BLUE, { hand: [ROCKS.gloriosa], costArea: { active: 4, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED, { characters: [VAN.kingdew, VAN.thatch], ...p2 }),
  );
}

describe('OP17-046 Gloriosa: [Blocker]', () => {
  it('CR 10-1-4-1: it has [Blocker] and can block', () => {
    const g = theirTurn(
      side(LEAD.rocks, BLUE, { characters: [ROCKS.gloriosa] }),
      side(LEAD.luffy, RED),
    );
    const gloriosa = g.find('p1', 'characters', ROCKS.gloriosa);
    expect(g.card(gloriosa).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([gloriosa]);
  });
});

describe('OP17-046 Gloriosa: [On Play] bottom-deck a Character with cost 5 or less', () => {
  it('happy path: the opponent’s cost-5 Character goes to the bottom of its owner’s deck (not the trash)', () => {
    const g = game();
    const before = g.zone('p2', 'deck').length;
    play(g, g.find('p1', 'hand', ROCKS.gloriosa));
    choose(g, [g.find('p2', 'characters', VAN.kingdew)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([VAN.thatch]);
    expect(g.zone('p2', 'deck')).toHaveLength(before + 1);
    expect(g.zone('p2', 'deck').at(-1)!.card).toBe(VAN.kingdew);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('target restriction: cost 5 or less only, either player’s Characters, never Leaders', () => {
    // p2: OP02-006 Kingdew (cost 5), OP02-007 Thatch (cost 6). p1: OP02-060 Mohji (cost 1).
    const g = game({ characters: [VAN.mohji] });
    play(g, g.find('p1', 'hand', ROCKS.gloriosa));
    const offeredIds = choiceCards(g);
    expect(offeredIds).toContain(VAN.kingdew);
    expect(offeredIds).toContain(VAN.mohji);
    expect(offeredIds).not.toContain(VAN.thatch);
    expect(offeredIds).not.toContain(LEAD.luffy);
    expect(offeredIds).not.toContain(LEAD.rocks);
  });

  it('CR 2-2-4-1: Gloriosa itself (cost 4, now a Character) may be chosen', () => {
    const g = game();
    play(g, g.find('p1', 'hand', ROCKS.gloriosa));
    expect(choiceCards(g)).toContain(ROCKS.gloriosa);
  });

  it('p1 may bottom-deck its own Character', () => {
    const g = game({ characters: [VAN.mohji] });
    play(g, g.find('p1', 'hand', ROCKS.gloriosa));
    choose(g, [g.find('p1', 'characters', VAN.mohji)]);
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(VAN.mohji);
  });

  it('CR 8-4-4-1: choosing none leaves every Character in place', () => {
    const g = game();
    play(g, g.find('p1', 'hand', ROCKS.gloriosa));
    chooseNone(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
  });

  it('with no Character of cost 5 or less except Gloriosa, choosing none is fine', () => {
    const g = game({}, { characters: [VAN.thatch] });
    play(g, g.find('p1', 'hand', ROCKS.gloriosa));
    if (decision(g)?.kind === 'choose') {
      expect(choiceCards(g)).not.toContain(VAN.thatch);
      chooseNone(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('CR 6-5-5-4: DON!! given to the removed Character return to its owner’s cost area rested', () => {
    const g = game({}, { characters: [{ card: VAN.kingdew, don: 2 }] });
    expect(donOf(g, 'p2').given).toBe(2);
    play(g, g.find('p1', 'hand', ROCKS.gloriosa));
    choose(g, [g.find('p2', 'characters', VAN.kingdew)]);
    expect(donOf(g, 'p2')).toMatchObject({ given: 0, rested: 2 });
  });
});
