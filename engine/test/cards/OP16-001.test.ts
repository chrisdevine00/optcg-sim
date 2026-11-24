/** OP16-001 Portgas.D.Ace (Leader). */
import { describe, expect, it } from 'vitest';
import { game, none, pick, PLAIN_BLUE } from './helpers.ts';
import {
  ACE_LEADER,
  canActivate,
  LUFFY_V,
  NON_WB8,
  offers,
  WB7,
  WB8,
  WB9,
} from './helpers-op16g1.ts';

const ID = ACE_LEADER;

describe('OP16-001 Portgas.D.Ace', () => {
  const start = (
    chars: Parameters<typeof game>[0]['characters'],
    costArea?: { active: number; rested: number },
  ) => game({ leader: ID, characters: chars, costArea }, { leader: PLAIN_BLUE });
  const act = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'rush' });

  it('[Activate: Main]: a [Monkey.D.Luffy] or a Whitebeard Pirates Character with 8000 power or more gains [Rush] this turn', () => {
    const g = start([WB8, WB9, WB7, LUFFY_V, NON_WB8]);
    act(g);
    // Offered: both 8000+ Whitebeard Characters and the Luffy; not the 7000 one, the non-Whitebeard 8000 or the vanilla.
    for (const c of [WB8, WB9, LUFFY_V])
      expect(offers(g, g.find('p1', 'characters', c))).toBe(true);
    for (const c of [WB7, NON_WB8]) expect(offers(g, g.find('p1', 'characters', c))).toBe(false);
    const big = g.find('p1', 'characters', WB9);
    pick(g, [big]);
    expect(g.card(big).keywords).toContain('Rush');
    expect(g.card(g.find('p1', 'characters', WB8)).keywords).not.toContain('Rush');
  });

  it('[Rush] lasts only this turn', () => {
    const g = start([WB8]);
    act(g);
    const c = g.find('p1', 'characters', WB8);
    pick(g, [c]);
    expect(g.card(c).keywords).toContain('Rush');
    g.act({ type: 'endTurn' });
    expect(g.card(c).keywords).not.toContain('Rush');
  });

  it('threshold: 7000 power is not enough, but 7000 plus 1 given DON!! (8000 on your turn) is', () => {
    const g = start([WB7]);
    act(g);
    expect(offers(g, g.find('p1', 'characters', WB7))).toBe(false);
    const g2 = start([{ card: WB7, don: 1 }]);
    act(g2);
    expect(offers(g2, g2.find('p1', 'characters', WB7))).toBe(true);
  });

  it('"up to 1": it may give [Rush] to nothing', () => {
    const g = start([WB8, LUFFY_V]);
    act(g);
    none(g);
    expect(g.card(g.find('p1', 'characters', WB8)).keywords).not.toContain('Rush');
    expect(g.card(g.find('p1', 'characters', LUFFY_V)).keywords).not.toContain('Rush');
  });

  it('is Once Per Turn', () => {
    const g = start([WB8]);
    act(g);
    pick(g, [g.find('p1', 'characters', WB8)]);
    expect(canActivate(g, g.leader('p1'), 'rush')).toBe(false);
  });
});
