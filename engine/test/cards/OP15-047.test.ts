/** OP15-047 Sanji. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { mine, OTHER_LEADER } from './helpers-op15g2.ts';

const ID = 'OP15-047';
const kw = (g: ReturnType<typeof mine>, p: 'p1' | 'p2', card: string) =>
  g.card(g.find(p, 'characters', card)).keywords;

describe('OP15-047 Sanji', () => {
  const start = () =>
    mine(OTHER_LEADER, { hand: [ID], characters: [V.c2] }, { characters: [V.c1] });

  it('has printed [Blocker]', () => {
    const g = mine(OTHER_LEADER, { characters: [ID] });
    expect(kw(g, 'p1', ID)).toContain('Blocker');
  });

  it('[On Play] up to 1 of your Characters gains [Unblockable] this turn', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(kw(g, 'p1', V.c2)).toContain('Unblockable');
    expect(kw(g, 'p1', ID)).not.toContain('Unblockable');
  });

  it('may choose itself, and only your own Characters are candidates', () => {
    const g = start();
    play(g, ID);
    const picks = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(picks).toHaveLength(2);
    expect(picks).not.toContain(g.find('p2', 'characters', V.c1));
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(kw(g, 'p1', ID)).toContain('Unblockable');
  });

  it('"up to 1": may choose nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(kw(g, 'p1', V.c2)).not.toContain('Unblockable');
    expect(dec(g)?.kind).toBe('main');
  });

  it('with no other Character Sanji is the only candidate and declining grants nothing', () => {
    const g = mine(OTHER_LEADER, { hand: [ID] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    none(g);
    expect(kw(g, 'p1', ID)).not.toContain('Unblockable');
  });
});
