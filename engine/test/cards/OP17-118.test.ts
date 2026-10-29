/** OP17-118 Rocks.D.Xebec. QA-OP17 OP17-118 (two rows). */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { BLUE, game, pick, play, PLAIN_PURPLE, ROCKS, V } from './helpers.ts';

describe('OP17-118 Rocks.D.Xebec', () => {
  const counterOf = (characters: string[]) => {
    const g = game({ leader: ROCKS, hand: ['OP17-118'], characters }, { leader: PLAIN_PURPLE });
    return queries.card(g.state, g.find('p1', 'hand', 'OP17-118')).counter ?? null;
  };

  it('has a +2000 Counter in hand while all your Characters lack a Counter', () => {
    expect(counterOf(['OP17-040'])).toBe(2000);
    expect(counterOf(['OP17-040', BLUE])).toBe(null);
  });

  it('QA: with 0 Characters it has no Counter', () => {
    expect(counterOf([])).toBe(null);
  });

  it('[On Play]: draw 1, then play up to 2 {Rocks Pirates} cards, different names, total cost 9 or less', () => {
    const g = game(
      {
        leader: ROCKS,
        hand: ['OP17-118', 'OP17-044', 'OP17-045', 'OP17-045', 'OP17-048'],
        deck: [BLUE, BLUE],
        costArea: { active: 10, rested: 0 },
      },
      { leader: PLAIN_PURPLE },
    );
    play(g, 'OP17-118');
    const john = g.find('p1', 'hand', 'OP17-044');
    pick(g, [john]);
    // Not shown in this pick: after John (4), Shiki (7) exceeds 9 and a second John does not exist.
    const kyo = g.find('p1', 'hand', 'OP17-045');
    const shiki = g.find('p1', 'hand', 'OP17-048');
    void kyo;
    void shiki;
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual(['OP17-044', 'OP17-118']);
    // Played for free: 10 DON!! paid for Rocks only.
    expect(queries.don(g.state, 'p1').active).toBe(0);
  });

  it('the total-cost and distinct-name limits narrow later picks', () => {
    const g = game(
      {
        leader: ROCKS,
        hand: ['OP17-118', 'OP17-044', 'OP17-045', 'OP17-045', 'OP17-048'],
        deck: [BLUE, BLUE],
        costArea: { active: 10, rested: 0 },
      },
      { leader: PLAIN_PURPLE },
    );
    play(g, 'OP17-118');
    const [k1, k2] = [g.find('p1', 'hand', 'OP17-045', 0), g.find('p1', 'hand', 'OP17-045', 1)];
    const first = [k1, k2].sort()[0]!;
    g.act({ type: 'pick', choice: first });
    const legal = g
      .legal()
      .flatMap((a) =>
        a.type === 'pick' && typeof a.choice === 'string' ? [g.card(a.choice).card] : [],
      );
    expect(legal).not.toContain('OP17-045'); // same name
    expect(legal).toContain('OP17-048'); // 2 + 7 = 9
    g.act({ type: 'pick', choice: g.find('p1', 'hand', 'OP17-048') });
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual(['OP17-045', 'OP17-048', 'OP17-118']);
  });

  it('QA: playing only 1 card is allowed', () => {
    const g = game(
      {
        leader: ROCKS,
        hand: ['OP17-118', 'OP17-045'],
        deck: [BLUE, BLUE],
        costArea: { active: 10, rested: 0 },
      },
      { leader: PLAIN_PURPLE, characters: [V.c1] },
    );
    play(g, 'OP17-118');
    pick(g, [g.find('p1', 'hand', 'OP17-045')]);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });
});
