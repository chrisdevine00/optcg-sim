/** OP12-065 Emporio.Ivankov. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, V } from './helpers.ts';
import {
  EVENT,
  EVENT2,
  ids,
  koedInBattle,
  mine,
  NAVY_LEADER,
  offered,
  rep,
} from './helpers-op12g2.ts';

const ID = 'OP12-065';

describe('OP12-065 Emporio.Ivankov', () => {
  const view = (trash: string[]) => {
    const g = mine({ characters: [ID], trash });
    return g.card(g.find('p1', 'characters', ID));
  };

  it('with 4 or more Events in your trash he gains [Blocker]', () => {
    expect(view(rep(4, EVENT)).keywords).toContain('Blocker');
    expect(view([EVENT, EVENT2, EVENT, EVENT2, EVENT]).keywords).toContain('Blocker');
  });

  it('boundary: 3 Events (or 4 cards of which 3 are Events) give no [Blocker]', () => {
    expect(view(rep(3, EVENT)).keywords).not.toContain('Blocker');
    expect(view([EVENT, EVENT, EVENT, V.c1, V.c2]).keywords).not.toContain('Blocker');
  });

  describe('[On K.O.] Add up to 1 Event from your trash to your hand', () => {
    const ko = (trash: string[]) => koedInBattle(ID, { leader: NAVY_LEADER, trash });

    it('adds the chosen Event; only Events are candidates', () => {
      const g = ko([V.c1, EVENT, EVENT2, V.c2]);
      expectDecision(g, 'choose', 'p1');
      const cands = offered(g);
      expect(cands).toContain(g.find('p1', 'trash', EVENT));
      expect(cands).toContain(g.find('p1', 'trash', EVENT2));
      expect(cands).toHaveLength(2);
      pick(g, [g.find('p1', 'trash', EVENT2)]);
      expect(hand(g, 'p1')).toEqual([EVENT2]);
      expect(ids(g, 'p1', 'trash')).toContain(ID);
    });

    it('"up to 1": may add nothing', () => {
      const g = ko([EVENT]);
      none(g);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('with no Event in the trash nothing happens', () => {
      const g = ko([V.c1, V.c2]);
      if (dec(g)?.kind === 'choose') none(g);
      expect(hand(g, 'p1')).toEqual([]);
    });
  });
});
