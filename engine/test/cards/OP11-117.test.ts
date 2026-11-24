/** OP11-117 Fish-Man Island (Stage, cost 2). */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { BLUE, expectDecision, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import {
  activate,
  canPick,
  FISHMAN,
  MERFOLK,
  mk,
  NEPTUNIAN,
  offeredAb,
  SHIRAHOSHI,
  up,
} from './helpers-op11g3.ts';

const ID = 'OP11-117';

describe('OP11-117 Fish-Man Island', () => {
  const start = (leader: string = SHIRAHOSHI, life: PlayerSpec['life'] = [BLUE, BLUE]) =>
    mk({ leader, life, stage: ID, characters: [NEPTUNIAN, FISHMAN, MERFOLK, V.c3] });

  it('[Activate: Main] [Once Per Turn] with [Shirahoshi]: turn the top Life card face-up: up to 1 "Neptunian", "Fish-Man" or "Merfolk" Character gains +1000 power', () => {
    const g = start();
    const stage = g.find('p1', 'stage', ID);
    activate(g, stage, 'activate');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', NEPTUNIAN))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', FISHMAN))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', MERFOLK))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'characters', FISHMAN)]);
    expect(g.power(g.find('p1', 'characters', FISHMAN))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', NEPTUNIAN))).toBe(8000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', FISHMAN))).toBe(3000);
  });

  it('once per turn: not offered a second time even with another face-down Life card', () => {
    const g = start();
    const stage = g.find('p1', 'stage', ID);
    activate(g, stage, 'activate');
    pick(g, [g.find('p1', 'characters', NEPTUNIAN)]);
    expect(offeredAb(g, stage, 'activate')).toBe(false);
  });

  it('"up to 1": the power may go to nobody (the Life card is still turned)', () => {
    const g = start();
    activate(g, g.find('p1', 'stage', ID), 'activate');
    none(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.power(g.find('p1', 'characters', NEPTUNIAN))).toBe(8000);
  });

  it('is not offered with a Leader that is not [Shirahoshi]', () => {
    const g = start(PLAIN_BLUE);
    expect(offeredAb(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
  });

  it('is not offered when the top Life card is already face-up', () => {
    const g = start(SHIRAHOSHI, [up(BLUE), BLUE]);
    expect(offeredAb(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
  });

  it('is not offered with no Life cards', () => {
    const g = start(SHIRAHOSHI, []);
    expect(offeredAb(g, g.find('p1', 'stage', ID), 'activate')).toBe(false);
  });
});
