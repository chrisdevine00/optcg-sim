/**
 * OP14-105 Gorgon Sisters (Character, Yellow, cost 6, 5000, Counter +2000; Kuja Pirates / The Seven
 * Warlords of the Sea).
 *
 * Card text:
 *   "[Activate: Main] [Once Per Turn] You may reveal 3 {Amazon Lily} or {Kuja Pirates} type cards from
 *    your hand: Give your Leader and all of your Characters up to 1 rested DON!! card each.
 *    [Trigger] If your Leader has the {Kuja Pirates} type, play this card."
 *
 * Rules: CR 8-3-1-3/8-3-1-4 an optional cost that cannot be paid is not usable; revealed cards stay
 * in hand; CR 10-2-13 once per turn; "up to 1 ... each": one DON!! per target at most, only rested
 * DON!! from the cost area (CR 6-5-5-2 style given DON!!). Hand scenery: OP08-048 Sweetpea (Amazon
 * Lily), OP07-043 Salome (Kuja Pirates), OP16-112 Boa Hancock (Kuja Pirates), OP01-023 Marco (neither).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activate,
  activateTrigger,
  BLUE,
  canActivate,
  reachablePickSets,
  donOf,
  hitLeader,
  kind,
  LD,
  LEAD,
  myTurn,
  offered,
  payWith,
  RED,
  rep,
  settleYes,
  side,
  sortedIds,
  theirTurn,
  V,
  VAN,
} from './kit-d.ts';

const GORGON = 'OP14-105';

function game(p1: Partial<PlayerSpec> = {}, leader: string = LD.kuja) {
  return myTurn(
    side(leader, BLUE, {
      characters: [GORGON, V.kuja8],
      hand: [V.sweetpea, V.salomeKuja, V.kuja8, VAN.marco],
      costArea: { active: 0, rested: 3 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

function reveal3(g: ReturnType<typeof game>) {
  activate(g, g.find('p1', 'characters', GORGON));
  payWith(g, [
    g.find('p1', 'hand', V.sweetpea),
    g.find('p1', 'hand', V.salomeKuja),
    g.find('p1', 'hand', V.kuja8),
  ]);
}

describe('OP14-105 Gorgon Sisters [Activate: Main]: reveal 3 Amazon Lily/Kuja cards, give rested DON!!', () => {
  it('only Amazon Lily / Kuja Pirates cards can be revealed (Marco is not offered)', () => {
    const g = game();
    activate(g, g.find('p1', 'characters', GORGON));
    // Picks of an unordered set are made in canonical order, so assert on the reachable sets. Depth 3:
    // the reveal is exactly 3; the per-target DON!! counts asked after it are not reveal picks.
    expect([...reachablePickSets(g, 3)]).toEqual([
      [V.kuja8, V.salomeKuja, V.sweetpea].sort().join('+'),
    ]);
  });

  it('with 3 rested DON!! the Leader and each Character get 1; the revealed cards stay in hand', () => {
    const g = game();
    reveal3(g);
    settleYes(g, 'p1');
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', GORGON)).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', V.kuja8)).don).toBe(1);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 0, given: 3 });
    expect(sortedIds(g, 'p1', 'hand')).toEqual(
      [V.sweetpea, V.salomeKuja, V.kuja8, VAN.marco].sort(),
    );
  });

  it('"up to 1 each": with 5 rested DON!! no target gets more than 1', () => {
    const g = game({ costArea: { active: 0, rested: 5 } });
    reveal3(g);
    settleYes(g, 'p1');
    for (const c of [
      g.leader('p1'),
      g.find('p1', 'characters', GORGON),
      g.find('p1', 'characters', V.kuja8),
    ]) {
      expect(g.card(c).don).toBeLessThanOrEqual(1);
    }
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 3 });
  });

  it('only RESTED DON!! are given: active DON!! stay active', () => {
    const g = game({ costArea: { active: 3, rested: 1 } });
    reveal3(g);
    settleYes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, given: 1 });
  });

  it('CR 8-3-1-3: with only 2 matching cards in hand the cost cannot be paid', () => {
    const g = game({ hand: [V.sweetpea, V.salomeKuja, VAN.marco] });
    expect(canActivate(g, g.find('p1', 'characters', GORGON))).toBe(false);
  });

  it('CR 10-2-13: [Once Per Turn]: a second activation is not offered', () => {
    const g = game();
    reveal3(g);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(canActivate(g, g.find('p1', 'characters', GORGON))).toBe(false);
  });

  it('"you may": declining the reveal gives no DON!!', () => {
    const g = game();
    const gorgon = g.find('p1', 'characters', GORGON);
    activate(g, gorgon);
    // Back out of the cost by choosing nothing, if the engine lets us.
    if (kind(g) === 'choose' && g.legal().some((a) => a.type === 'done')) {
      g.act({ type: 'done' });
    }
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(offered(g, 'p1')).toBe(false);
  });
});

describe('OP14-105 Gorgon Sisters [Trigger]: play this card if your Leader is Kuja Pirates', () => {
  function trig(leader: string) {
    const g = theirTurn(
      side(leader, BLUE, { life: [GORGON, ...rep(BLUE, 3)] }),
      side(LEAD.luffy, RED),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('Kuja Leader: it is played', () => {
    expect(sortedIds(trig(LD.kuja), 'p1', 'characters')).toEqual([GORGON]);
  });

  it('CR 4-10-1: a Leader without the type: it is not played (trashed)', () => {
    const g = trig(LD.navy);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([GORGON]);
  });
});
