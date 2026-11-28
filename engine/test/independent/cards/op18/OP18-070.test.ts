/**
 * OP18-070 Tom (Character, Purple, cost 1, 2000, Counter +2000, types Fish-Man / Water Seven).
 *
 * Card text (cards/data):
 *   "[On Play] DON!! −1, you may trash 1 card from your hand: Add up to 2 Stage cards from your
 *    trash to your hand."
 *
 * Rules: CR 8-3-1 (all parts of a cost must be payable, paid in text order); CR 8-3-1-6 / RL-23
 * (DON!! −X may return rested cost-area DON!!, including the one rested to play Tom); CR 8-4-4-1
 * ("up to" may choose fewer or none); QA-GR (an [On Play] with a cost may be declined).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import {
  accept,
  choiceCards,
  chooseNone,
  choose,
  count,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  payWith,
  PURPLE,
  RED,
  side,
  sortedIds,
  VAN,
} from '../kit.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const TOM = 'OP18-070';
/** OP05-040 Birdcage: Green Stage, cost 5. OP06-041 The Ark Noah: Green Stage, cost 6. ST01-017: Red Stage, cost 1. */
const STAGE_A = 'OP05-040';
const STAGE_B = 'OP06-041';
const STAGE_C = 'ST01-017';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return myTurn(
    side(LEAD.kaido, PURPLE, {
      hand: [TOM, VAN.gordon],
      trash: [STAGE_A, VAN.sai, STAGE_B, STAGE_C],
      costArea: { active: 3, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, p2),
  );
}

function playTom(g: TestGame): void {
  play(g, g.find('p1', 'hand', TOM));
}

/** Say yes to the cost question (if asked), return 1 DON!!, trash the fodder card. */
function payCost(g: TestGame): void {
  if (offered(g, 'p1')) accept(g);
  payDon(g, 1, 'costRested');
  payWith(g, [g.find('p1', 'hand', VAN.gordon)]);
}

describe('OP18-070 Tom: [On Play] DON!! −1, you may trash 1 → add up to 2 Stages from trash to hand', () => {
  it('happy path: pay both costs, take 2 Stages; they leave the trash, the fodder arrives there', () => {
    const g = game();
    playTom(g);
    payCost(g);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'trash', STAGE_A), g.find('p1', 'trash', STAGE_B)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([STAGE_A, STAGE_B].sort());
    expect(sortedIds(g, 'p1', 'trash')).toEqual([STAGE_C, VAN.sai, VAN.gordon].sort());
    expect(donOf(g, 'p1').deck).toBe(8);
    expect(kind(g)).toBe('main');
  });

  it('only Stage cards in the trash are offered, not Characters', () => {
    const g = game();
    playTom(g);
    payCost(g);
    expect(choiceCards(g)).toEqual([STAGE_A, STAGE_B, STAGE_C].sort());
  });

  it('"up to 2": taking just 1 Stage is allowed', () => {
    const g = game();
    playTom(g);
    payCost(g);
    choose(g, [g.find('p1', 'trash', STAGE_B)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([STAGE_B]);
    expect(count(g, 'p1', 'trash')).toBe(4);
  });

  it('"up to 2": taking none is allowed, and the costs stay paid', () => {
    const g = game();
    playTom(g);
    payCost(g);
    chooseNone(g);
    expect(count(g, 'p1', 'hand')).toBe(0);
    expect(donOf(g, 'p1').deck).toBe(8);
    expect(sortedIds(g, 'p1', 'trash')).toContain(VAN.gordon);
  });

  it('with only 1 Stage in the trash, that 1 can be added', () => {
    const g = game({ trash: [VAN.sai, STAGE_C] });
    playTom(g);
    payCost(g);
    choose(g, [g.find('p1', 'trash', STAGE_C)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([STAGE_C]);
  });

  it('QA-GR: declining the cost returns no DON!!, trashes nothing and adds nothing', () => {
    const g = game();
    playTom(g);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1').deck).toBe(7);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.gordon]);
    expect(count(g, 'p1', 'trash')).toBe(4);
  });

  it('CR 8-3-1-3: with no other card in hand the trash cost cannot be paid; no DON!! is returned, nothing added', () => {
    const g = game({ hand: [TOM] });
    playTom(g);
    // The engine may ask first and offer only "no", or not ask at all.
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1').deck).toBe(7);
    expect(count(g, 'p1', 'hand')).toBe(0);
    expect(count(g, 'p1', 'trash')).toBe(4);
  });

  it('CR 8-3-1-6: the one DON!! rested to play Tom can be the DON!! returned', () => {
    const g = game({ costArea: { active: 1, rested: 0 } });
    playTom(g);
    payCost(g);
    choose(g, [g.find('p1', 'trash', STAGE_A)]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
    expect(sortedIds(g, 'p1', 'hand')).toEqual([STAGE_A]);
  });

  it('with no Stage in the trash nothing can be added (the hand is unchanged by the effect)', () => {
    const g = game({ trash: [VAN.sai] });
    playTom(g);
    if (offered(g, 'p1')) {
      accept(g);
      payDon(g, 1, 'costRested');
      payWith(g, [g.find('p1', 'hand', VAN.gordon)]);
    }
    if (kind(g) === 'choose') chooseNone(g);
    expect(sortedIds(g, 'p1', 'hand').filter((c) => c !== VAN.gordon)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('only your own trash is searched: the opponent’s Stages are not offered', () => {
    const g = game({ trash: [STAGE_A] }, { trash: [STAGE_B, STAGE_C] });
    playTom(g);
    payCost(g);
    expect(choiceCards(g)).toEqual([STAGE_A]);
    choose(g, [g.find('p1', 'trash', STAGE_A)]);
    expect(count(g, 'p2', 'trash')).toBe(2);
  });
});
