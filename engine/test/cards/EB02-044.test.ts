/** EB02-044 Sengoku. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play } from './helpers.ts';
import {
  BLACK_PLAIN4,
  canPick,
  ids,
  mk,
  NAVY1,
  NAVY4,
  NAVY5,
  NAVY6,
  NAVY_PURPLE4,
} from './helpers-aeb2g2.ts';

const ID = 'EB02-044';
const start = (trash: string[]) => {
  const g = mk({ hand: [ID], trash });
  play(g, ID);
  return g;
};

describe('EB02-044 Sengoku', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] plays a black {Navy} Character with cost 4 or less from the trash, rested', () => {
    const g = start([NAVY4, NAVY1]);
    expect(canPick(g, g.find('p1', 'trash', NAVY4))).toBe(true);
    pick(g, [g.find('p1', 'trash', NAVY4)]);
    const chars = g.zone('p1', 'characters');
    expect(chars.map((c) => c.card)).toEqual([ID, NAVY4]);
    expect(chars[0]!.rested).toBe(false);
    expect(chars[1]!.rested).toBe(true);
    expect(ids(g, 'p1', 'trash')).toEqual([NAVY1]);
  });

  it('cost boundary: cost 4 is playable, cost 5 and cost 6 are not', () => {
    const g = start([NAVY5, NAVY6, NAVY4]);
    expect(canPick(g, g.find('p1', 'trash', NAVY4))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', NAVY5))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', NAVY6))).toBe(false);
  });

  it('a {Navy} Character that is not black and a black Character that is not {Navy} are not offered', () => {
    const g = start([NAVY_PURPLE4, BLACK_PLAIN4]);
    // The trash is public: with no match nothing is asked.
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play nothing', () => {
    const g = start([NAVY4]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'trash')).toEqual([NAVY4]);
  });
});
