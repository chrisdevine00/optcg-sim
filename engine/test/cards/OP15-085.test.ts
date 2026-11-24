/** OP15-085 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import {
  canActivate,
  CHOPPER_V,
  donArea,
  fill,
  mine,
  names,
  OTHER_LEADER,
  SHC_C4,
  SHC_LEADER,
} from './helpers-op15g3.ts';

const ID = 'OP15-085';

describe('OP15-085 Tony Tony.Chopper', () => {
  it('[On Play] trashes exactly 3 cards from the top of the deck (any Leader)', () => {
    const g = mine({ leader: OTHER_LEADER, hand: [ID], deck: fill(10, V.c1), ...donArea(2) });
    play(g, ID);
    expect(names(g, 'p1', 'trash')).toHaveLength(3);
    expect(names(g, 'p1', 'deck')).toHaveLength(7);
  });

  describe('[Activate: Main]', () => {
    const start = (leader: string, trash: string[]) => mine({ leader, characters: [ID], trash });
    const use = (g: ReturnType<typeof start>) =>
      g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'recover' });

    it('trash this Character: with a {Straw Hat Crew} Leader add up to 1 other {Straw Hat Crew} Character from the trash to your hand', () => {
      const g = start(SHC_LEADER, [SHC_C4, V.c1]);
      use(g);
      expect(names(g, 'p1', 'characters')).toEqual([]);
      pick(g, [g.find('p1', 'trash', SHC_C4)]);
      expect(names(g, 'p1', 'hand')).toEqual([SHC_C4]);
      expect(names(g, 'p1', 'trash').sort()).toEqual([ID, V.c1].sort());
    });

    it('a Character named [Tony Tony.Chopper] (any printing, and this card) cannot be added; non-Straw Hat Crew cards cannot either', () => {
      const g = start(SHC_LEADER, [CHOPPER_V, V.c1]);
      use(g);
      // This card is in the trash too (excluded by name): nothing is a candidate, so nothing is asked.
      expectDecision(g, 'main', 'p1');
      expect(names(g, 'p1', 'hand')).toEqual([]);
    });

    it('"up to 1": nothing is forced', () => {
      const g = start(SHC_LEADER, [SHC_C4]);
      use(g);
      expectDecision(g, 'choose', 'p1');
      none(g);
      expect(names(g, 'p1', 'hand')).toEqual([]);
      expect(names(g, 'p1', 'characters')).toEqual([]);
    });

    it('with a Leader that is not {Straw Hat Crew} the cost is still paid and nothing is added', () => {
      const g = start(OTHER_LEADER, [SHC_C4]);
      expect(canActivate(g, g.find('p1', 'characters', ID), 'recover')).toBe(true);
      use(g);
      expect(names(g, 'p1', 'characters')).toEqual([]);
      expect(names(g, 'p1', 'hand')).toEqual([]);
      expect(names(g, 'p1', 'trash')).toContain(ID);
    });
  });
});
