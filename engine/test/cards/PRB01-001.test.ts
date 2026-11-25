/** PRB01-001 Sanji (Leader). */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { dec, game, none, PLAIN_BLUE, pick, V } from './helpers.ts';
import {
  activate,
  atMain,
  canPick,
  COST8,
  COST9,
  offeredAb,
  offeredPicks,
  TRIGGER_ONLY,
  WITH_ON_PLAY,
} from './helpers-w6c2.ts';

const ID = 'PRB01-001';
/** A Character whose only text is [Blocker] and its reminder: no base effect, so no [On Play]. */
const BLOCKER_ONLY = 'OP01-100';
const AB = 'rush';
const mk = (p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) =>
  game(
    {
      leader: ID,
      characters: [COST8, COST9, WITH_ON_PLAY, TRIGGER_ONLY, BLOCKER_ONLY],
      ...p1,
    },
    { leader: PLAIN_BLUE, characters: [V.c2], ...p2 },
  );
const use = (g: ReturnType<typeof mk>) => activate(g, g.leader('p1'), AB);
const rush = (g: ReturnType<typeof mk>, card: string) =>
  g.card(g.find('p1', 'characters', card)).keywords.includes('Rush');

describe('PRB01-001 Sanji', () => {
  it('[Activate: Main] [Once Per Turn]: a Character without an [On Play] effect and with cost 8 or less gains [Rush]', () => {
    const g = mk();
    use(g);
    // Cost 8 is in, cost 9 is out; a printed [On Play] is out; a [Trigger] only is not an [On Play].
    expect(offeredPicks(g).sort()).toEqual(
      [
        g.find('p1', 'characters', COST8),
        g.find('p1', 'characters', TRIGGER_ONLY),
        g.find('p1', 'characters', BLOCKER_ONLY),
      ].sort(),
    );
    expect(canPick(g, g.find('p1', 'characters', COST9))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', WITH_ON_PLAY))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p1', 'characters', COST8)]);
    expect(rush(g, COST8)).toBe(true);
    expect(rush(g, TRIGGER_ONLY)).toBe(false);
    expect(atMain(g)).toBe(true);
  });

  it('[Once Per Turn]: it is not offered a second time, even after choosing nobody ("up to 1")', () => {
    const g = mk();
    expect(offeredAb(g, g.leader('p1'), AB)).toBe(true);
    use(g);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(rush(g, COST8)).toBe(false);
    expect(offeredAb(g, g.leader('p1'), AB)).toBe(false);
  });

  it('[Rush] lets a Character played this turn attack, and only the chosen one', () => {
    const g = mk({
      characters: [
        { card: COST8, playedThisTurn: true },
        { card: V.c1, playedThisTurn: true },
      ],
    });
    const hit = (card: string) =>
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', card),
        target: g.leader('p2'),
        player: 'p1',
      });
    expect(hit(COST8)).toBe(false);
    use(g);
    pick(g, [g.find('p1', 'characters', COST8)]);
    expect(hit(COST8)).toBe(true);
    expect(hit(V.c1)).toBe(false);
  });

  it('with no eligible Character the pick is empty and nothing breaks (cost 9 and an [On Play] only)', () => {
    const g = mk({ characters: [COST9, WITH_ON_PLAY] });
    use(g);
    // Raw: "up to 1" with no candidate asks at most an empty pick.
    if (dec(g)?.kind === 'choose') {
      expect(offeredPicks(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(rush(g, COST9)).toBe(false);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });
});
