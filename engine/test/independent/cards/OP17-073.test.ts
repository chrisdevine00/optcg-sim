/**
 * OP17-073 Basil Hawkins (Character, Purple, cost 3, 1000, Counter +2000, types Animal Kingdom
 * Pirates / Hawkins Pirates).
 *
 * Card text (cards/data, no override text patch):
 *   "[On Play] You may trash 1 card from your hand: If your Leader has the {Animal Kingdom Pirates}
 *    type, add up to 1 DON!! card as active from your DON!! deck."
 *
 * Rules: CR 8-3-1-3 / 8-3-1-4 (an optional cost that cannot be paid is not offered; skipping it
 * means no effect); CR 4-10-1 failed "if"; RL-50 (QA-OP01 OP01-101: a trash cost can be paid even
 * when the DON!! deck is empty, and the add then does nothing); CR 10-2-14-1 (trash = from hand).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act } from '../helpers.ts';
import {
  accept,
  AKP,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payWith,
  PURPLE,
  RED,
  side,
  sortedIds,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function game(p1: Partial<PlayerSpec>, leader: string = LEAD.kaido) {
  return myTurn(
    side(leader, PURPLE, { costArea: { active: 3, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED),
  );
}

function playHawkins(g: TestGame): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.hawkins) });
}

describe('OP17-073 Basil Hawkins: [On Play] you may trash 1 → +1 active DON!! (AKP Leader)', () => {
  it('happy path: trash 1, add 1 active DON!! from the DON!! deck', () => {
    const g = game({ hand: [AKP.hawkins, VAN.gordon] });
    playHawkins(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.gordon)]);
    if (offered(g, 'p1')) accept(g); // "up to 1" asked as a yes/no
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.gordon]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 3, deck: 6 });
  });

  it('the added DON!! is active and can be spent at once (play a 1-cost Character)', () => {
    const g = game({ hand: [AKP.hawkins, VAN.gordon, VAN.komachiyo] });
    playHawkins(g);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.gordon)]);
    if (offered(g, 'p1')) accept(g);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', VAN.komachiyo) });
    expect(sortedIds(g, 'p1', 'characters')).toEqual([AKP.hawkins, VAN.komachiyo].sort());
  });

  it('CR 8-3-1-3: with no other card in hand the cost cannot be paid, so nothing is offered', () => {
    const g = game({ hand: [AKP.hawkins] });
    playHawkins(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1').deck).toBe(7);
  });

  it('CR 8-3-1-4: declining keeps the hand and adds nothing', () => {
    const g = game({ hand: [AKP.hawkins, VAN.gordon] });
    playHawkins(g);
    decline(g);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.gordon]);
    expect(donOf(g, 'p1').deck).toBe(7);
  });

  it('CR 4-10-1: with a non-AKP Leader (ST05-001 Shanks) the trash is paid but no DON!! is added', () => {
    const g = game({ hand: [AKP.hawkins, VAN.gordon] }, LEAD.shanks);
    playHawkins(g);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.gordon)]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.gordon]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, deck: 7 });
  });

  it('RL-50: with an empty DON!! deck the cost may still be paid; nothing is added', () => {
    const g = game({ hand: [AKP.hawkins, VAN.gordon], costArea: { active: 10, rested: 0 } });
    playHawkins(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.gordon)]);
    if (offered(g, 'p1')) accept(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 7, rested: 3, deck: 0 });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.gordon]);
  });
});
