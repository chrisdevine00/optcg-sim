/** OP17-031 Yasopp. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, PLAIN_BLUE, pick, play, V } from './helpers.ts';
import { OTHER_LEADER, RHP_4 } from './helpers-op17g2.ts';

const ID = 'OP17-031';

describe('OP17-031 Yasopp', () => {
  const start = () =>
    game(
      { leader: OTHER_LEADER, hand: [ID], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c7, 'OP01-110'] },
    );

  it("[On Play]: draw 1 card and rest up to 1 of your opponent's Characters with a cost of 8 or less", () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(true);
  });

  it('"up to 1": rest nothing, still draws', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });

  it('a Character with a cost of 9 or more is not a candidate', () => {
    const g = game(
      { leader: OTHER_LEADER, hand: [ID], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, characters: ['P-041'] },
    );
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.card(g.find('p2', 'characters', 'P-041')).rested).toBe(false);
  });

  describe('[End of Your Turn]', () => {
    it('with Yasopp on the field: a rested {Red-Haired Pirates} Character becomes active, others do not', () => {
      const g = game(
        {
          leader: OTHER_LEADER,
          characters: [ID, { card: RHP_4, rested: true }, { card: V.c1, rested: true }],
        },
        { leader: PLAIN_BLUE },
      );
      g.act({ type: 'endTurn' });
      // Candidates: Yasopp (active already) and the rested RHP vanilla; the non-RHP rested one is not.
      pick(g, [g.find('p1', 'characters', RHP_4)]);
      expect(g.card(g.find('p1', 'characters', RHP_4)).rested).toBe(false);
      expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
    });
  });
});
