/** ST28-002 Izo. */
import { describe, expect, it } from 'vitest';
import {
  canBlockWith,
  dec,
  mk,
  p2Attacks,
  play,
  PLAIN_BLUE,
  V,
  WANO_LEADER,
} from './helpers-lfc.ts';

const ID = 'ST28-002';

describe('ST28-002 Izo', () => {
  const withDon = (n: number) => {
    const g = mk({ characters: [{ card: ID, don: n }], costArea: { active: 8, rested: 0 } });
    return g.card(g.find('p1', 'characters', ID));
  };

  it('[DON!! x2]: gains [Blocker] with 2 DON!! given, not with 1 or 0', () => {
    expect(withDon(2).keywords).toContain('Blocker');
    expect(withDon(1).keywords).not.toContain('Blocker');
    expect(withDon(0).keywords).not.toContain('Blocker');
  });

  it('the granted [Blocker] can block an attack; with 1 DON!! it cannot', () => {
    const on = p2Attacks(
      {
        leader: PLAIN_BLUE,
        characters: [{ card: ID, don: 2 }],
        costArea: { active: 8, rested: 0 },
      },
      V.c4,
    );
    expect(canBlockWith(on, on.find('p1', 'characters', ID))).toBe(true);
    const off = p2Attacks(
      {
        leader: PLAIN_BLUE,
        characters: [{ card: ID, don: 1 }],
        costArea: { active: 9, rested: 0 },
      },
      V.c4,
    );
    expect(canBlockWith(off, off.find('p1', 'characters', ID))).toBe(false);
  });

  it('[On Play]: a {Land of Wano} Leader gains [Banish] during this turn only', () => {
    const g = mk({ leader: WANO_LEADER, hand: [ID] });
    expect(g.card(g.leader('p1')).keywords).not.toContain('Banish');
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.leader('p1')).keywords).toContain('Banish');
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.leader('p1')).keywords).not.toContain('Banish');
  });

  it('must not grant [Banish] to a Leader without the {Land of Wano} type, nor to a Character', () => {
    const g = mk({ leader: PLAIN_BLUE, hand: [ID], characters: [V.c3] });
    play(g, ID);
    expect(g.card(g.leader('p1')).keywords).not.toContain('Banish');
    expect(g.card(g.find('p1', 'characters', V.c3)).keywords).not.toContain('Banish');
    const w = mk({ leader: WANO_LEADER, hand: [ID], characters: [V.c3] });
    play(w, ID);
    expect(w.card(w.find('p1', 'characters', V.c3)).keywords).not.toContain('Banish');
  });
});
