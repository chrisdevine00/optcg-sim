/**
 * OP17-075 X.Drake (Character, Purple, cost 2, 2000, Counter +2000, types Navy / Drake Pirates /
 * Animal Kingdom Pirates).
 *
 * Card text (cards/data; the normalizer restored the sign of "DON!! −2", textFixes):
 *   "[On Play] DON!! −2: Trash 1 card from your opponent's hand."
 *
 * Rules: QA-GR (an [On Play] with a cost may be declined); CR 8-3-1-6 / RL-23 (DON!! −X may return
 * rested cost-area DON!!, including the ones just rested to play Drake); CR 1-3-2 (an impossible
 * action is not performed). Who picks the card is not stated; these tests check only the outcome
 * (see the report's ambiguity list).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, decision } from '../helpers.ts';
import {
  accept,
  AKP,
  choices,
  count,
  decline,
  donOf,
  donOnField,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  side,
  sortedIds,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function game(p1: Partial<PlayerSpec>, p2: Partial<PlayerSpec> = { hand: [VAN.marco, VAN.sai] }) {
  return myTurn(
    side(LEAD.kaido, PURPLE, { hand: [AKP.drake], costArea: { active: 4, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED, p2),
  );
}

function playDrake(g: TestGame): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.drake) });
}

/** Whoever is asked to pick the card to trash, pick the first offered. */
function pickTrashed(g: TestGame): void {
  for (let i = 0; i < 5 && kind(g) === 'choose'; i++) {
    const c = choices(g)[0];
    if (!c) break;
    act(g, { type: 'pick', choice: c, player: decision(g)!.player });
  }
}

describe('OP17-075 X.Drake: [On Play] DON!! −2 → trash 1 card from the opponent’s hand', () => {
  it('happy path: return 2 DON!!; the opponent loses 1 hand card to the trash', () => {
    const g = game({});
    playDrake(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 2, 'costRested');
    pickTrashed(g);
    expect(count(g, 'p2', 'hand')).toBe(1);
    expect(count(g, 'p2', 'trash')).toBe(1);
    expect(donOf(g, 'p1').deck).toBe(8);
    expect(kind(g)).toBe('main');
  });

  it('it is the opponent’s hand, not p1’s, that loses a card', () => {
    const g = game({ hand: [AKP.drake, VAN.gordon] });
    playDrake(g);
    accept(g);
    payDon(g, 2, 'costRested');
    pickTrashed(g);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.gordon]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('QA-GR: declining the DON!! −2 trashes nothing and returns no DON!!', () => {
    const g = game({});
    playDrake(g);
    decline(g);
    expect(count(g, 'p2', 'hand')).toBe(2);
    expect(donOf(g, 'p1').deck).toBe(6);
  });

  it('CR 8-3-1-6: the 2 DON!! rested to play Drake can pay the DON!! −2', () => {
    const g = game({ costArea: { active: 2, rested: 0 } });
    playDrake(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 2, 'costRested');
    pickTrashed(g);
    expect(donOnField(g, 'p1')).toBe(0);
    expect(donOf(g, 'p1').deck).toBe(10);
    expect(count(g, 'p2', 'hand')).toBe(1);
  });

  it('CR 1-3-2: with the opponent’s hand empty, the effect does nothing', () => {
    const g = game({}, { hand: [] });
    playDrake(g);
    if (offered(g, 'p1')) {
      accept(g);
      payDon(g, 2, 'costRested');
      pickTrashed(g);
    }
    expect(g.zone('p2', 'trash')).toHaveLength(0);
    expect(kind(g)).toBe('main');
  });
});
