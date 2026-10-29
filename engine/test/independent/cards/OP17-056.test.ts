/**
 * OP17-056 Rocks Pirates (Event, Blue, cost 0, type Rocks Pirates).
 *
 * Card text (cards/data):
 *   "[Main] You may rest 5 of your DON!! cards: Return up to 1 Character with a cost of 6 or less
 *    to the owner's hand.
 *
 *    [Counter] Up to 1 of your Leader with a type including "Rocks Pirates" or up to 1 of your
 *    Characters with a type including "Rocks Pirates" gains +2000 power during this battle."
 *
 * Rules: "Character" is any Character in a Character area, either player's (CR 2-2-4-1). The cost
 * is all or nothing (CR 8-3-1-3); a skipped optional cost means no effect (CR 8-3-1-4). A returned
 * Character's DON!! go to its owner's cost area rested (CR 6-5-5-4). The [Counter] is one target in
 * total, as for OP17-055.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, passBlock, takeDamage } from '../helpers.ts';
import {
  accept,
  BLUE,
  choiceCards,
  choose,
  chooseIfAsked,
  chooseNone,
  donOf,
  eventCounterTargets,
  LEAD,
  myTurn,
  offered,
  payDon,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function mainPhase(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LEAD.rocks, BLUE, { hand: [ROCKS.rocksEvent], costArea: { active: 5, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED, { characters: [VAN.thatch, VAN.littleOars], ...p2 }),
  );
}

function castMain(g: TestGame) {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', ROCKS.rocksEvent) });
  // Playing the Event is choosing to use its [Main]; accept a "use" question only if asked.
  if (offered(g, 'p1')) accept(g);
  payDon(g, 5);
}

describe('OP17-056 Rocks Pirates: [Main] rest 5 DON!!: return a cost-6-or-less Character to hand', () => {
  it('happy path: the opponent’s cost-6 Thatch returns to its owner’s hand; 5 DON!! are rested', () => {
    const g = mainPhase();
    castMain(g);
    choose(g, [g.find('p2', 'characters', VAN.thatch)]);
    expect(sortedIds(g, 'p2', 'hand')).toEqual([VAN.thatch]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([VAN.littleOars]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.rocksEvent]);
  });

  it('target restriction: cost 6 or less, either player’s Characters (not cost 7, not Leaders)', () => {
    const g = mainPhase({ characters: [VAN.mohji] });
    castMain(g);
    expect(choiceCards(g)).toEqual([VAN.mohji, VAN.thatch].sort());
  });

  it('p1 may return its own Character to its own hand', () => {
    const g = mainPhase({ characters: [VAN.mohji] });
    castMain(g);
    choose(g, [g.find('p1', 'characters', VAN.mohji)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.mohji]);
  });

  it('CR 8-4-4-1: choosing none returns nothing', () => {
    const g = mainPhase();
    castMain(g);
    chooseNone(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('CR 8-3-1-3: with 4 active DON!! the cost cannot be paid: if the Event can be played at all, nothing returns', () => {
    const g = mainPhase({ costArea: { active: 4, rested: 1 } });
    const event = g.find('p1', 'hand', ROCKS.rocksEvent);
    if (g.legal().some((a) => a.type === 'playCard' && a.card === event)) {
      act(g, { type: 'playCard', card: event });
      expect(offered(g, 'p1')).toBe(false);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
  });

  it('CR 6-5-5-4: DON!! given to the returned Character go to its owner’s cost area rested', () => {
    const g = mainPhase({}, { characters: [{ card: VAN.thatch, don: 1 }] });
    castMain(g);
    choose(g, [g.find('p2', 'characters', VAN.thatch)]);
    expect(donOf(g, 'p2')).toMatchObject({ given: 0, rested: 1 });
  });
});

describe('OP17-056 Rocks Pirates: [Counter] +2000 to a Rocks Pirates Leader or Character', () => {
  function defending(p1: Partial<PlayerSpec> = {}, leader: string = LEAD.rocks) {
    return theirTurn(
      side(leader, BLUE, { hand: [ROCKS.rocksEvent], ...p1 }),
      side(LEAD.luffy, RED),
    );
  }

  it('happy path: the Rocks Leader gets +2000 for the battle and the 5000 attack fails', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ROCKS.rocksEvent), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('target restriction: not a non-Rocks Character, not a non-Rocks Leader', () => {
    const g = defending({ characters: [ROCKS.kyo, VAN.mohji] }, LEAD.crocodile);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const targets = eventCounterTargets(g, g.find('p1', 'hand', ROCKS.rocksEvent));
    expect(targets).toContain(g.find('p1', 'characters', ROCKS.kyo));
    expect(targets).not.toContain(g.find('p1', 'characters', VAN.mohji));
    expect(targets).not.toContain(g.leader('p1'));
  });
});
