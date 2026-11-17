/** OP10-114 X.Drake. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { ROSI } from './helpers-hancock-rosi.ts';

describe('OP10-114 X.Drake', () => {
  const start = (mine: number, theirs: number, opp: string[] = [V.c3, V.c5]) =>
    game(
      {
        leader: ROSI,
        characters: ['OP10-114'],
        life: Array.from({ length: mine }, () => PURPLE),
      },
      {
        leader: PLAIN_BLUE,
        characters: opp,
        life: Array.from({ length: theirs }, () => PURPLE),
      },
    );
  const use = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP10-114'), ability: 'rest-opp' });

  it('rests itself, then rests up to 1 of the opponent Characters with a cost of 4 or less', () => {
    const g = start(3, 3);
    use(g);
    expect(g.card(g.find('p1', 'characters', 'OP10-114')).rested).toBe(true);
    // The cost 5 Character is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('works with fewer Life cards than the opponent', () => {
    const g = start(2, 4);
    use(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it('with more Life than the opponent the rest cost is still paid and nothing is rested', () => {
    const g = start(4, 3);
    use(g);
    expect(g.card(g.find('p1', 'characters', 'OP10-114')).rested).toBe(true);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('is not offered while Drake is rested', () => {
    const g = start(3, 3);
    use(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.legal().some((a) => a.type === 'activate' && a.ability === 'rest-opp')).toBe(false);
  });

  it('may use up to 1 with no legal target', () => {
    const g = start(3, 3, [V.c5]);
    use(g);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });
});
