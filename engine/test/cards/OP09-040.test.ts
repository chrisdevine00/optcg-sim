/** OP09-040 Thunder Lance Flip Caliber Phoenix Shot (Event, cost 3). */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  canPick,
  damageGame,
  expectDecision,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  rested,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-040';

describe('OP09-040 Thunder Lance Flip Caliber Phoenix Shot: [Main]', () => {
  const start = (mine: PlayerSpec['characters'], theirs: PlayerSpec['characters'] = [V.c4, V.c5]) =>
    mk({ hand: [ID], characters: mine }, { characters: theirs });

  it("with 2 rested Characters, K.O. up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    const g = start([rested(V.c1), rested(V.c2)]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // cost 4: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c4]);
  });

  it('boundary: 1 rested Character is not enough; nothing is asked', () => {
    const g = start([rested(V.c1), V.c2]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c4, V.c5]);
  });

  it('more than 2 rested Characters is fine', () => {
    const g = start([rested(V.c1), rested(V.c2), rested(V.c3)]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
  });

  it("the opponent's rested Characters do not count", () => {
    const g = start([rested(V.c1), V.c2], [rested(V.c4), rested(V.c3)]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start([rested(V.c1), rested(V.c2)]);
    play(g, ID);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c4, V.c5]);
  });
});

describe('OP09-040 Thunder Lance Flip Caliber Phoenix Shot: [Trigger]', () => {
  it("rests up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    const g = damageGame(ID, { leader: OTHER_LEADER }, { characters: [V.c3, V.c4, V.c5] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // cost 4: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('works with no rested Character of yours (no condition on the [Trigger])', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER }, { characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
  });

  it('"up to 1": may rest nothing', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER }, { characters: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });
});
