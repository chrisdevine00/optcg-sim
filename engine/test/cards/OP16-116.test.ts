/** OP16-116 Zehahahahaha! */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { names, OTHER_LEADER, TEACH, trig } from './helpers-op16g4.ts';

const ID = 'OP16-116';

/** Cost 8: `active` + `rested` DON!! on the field before paying. */
const start = (active: number, rested: number, h: string[] = [TEACH]) =>
  game(
    { leader: PLAIN_BLUE, hand: [ID, ...h], costArea: { active, rested } },
    { leader: PLAIN_BLUE },
  );

describe('OP16-116 Zehahahahaha!', () => {
  describe('[Main]', () => {
    it("with 10 DON!!: plays [Marshall.D.Teach] from hand; then adds up to 1 of your opponent's Life cards to their hand", () => {
      const g = start(10, 0);
      play(g, ID);
      pick(g, [g.find('p1', 'hand', TEACH)]);
      accept(g);
      expect(names(g, 'p1', 'characters')).toEqual([TEACH]);
      expect(g.life('p2')).toBe(2);
      expect(hand(g, 'p2')).toHaveLength(1);
      expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(10);
    });

    it('must not fire with 9 DON!! on the field (rested DON!! count at 10)', () => {
      const g = start(8, 1);
      play(g, ID);
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
      expect(names(g, 'p1', 'characters')).toEqual([]);
      expect(g.life('p2')).toBe(3);
    });

    it('10 DON!! in total (8 active, 2 rested) counts, and 8 of them are rested by paying the cost', () => {
      const g = start(8, 2);
      play(g, ID);
      pick(g, [g.find('p1', 'hand', TEACH)]);
      expect(names(g, 'p1', 'characters')).toEqual([TEACH]);
    });

    it('with 10 DON!! and no [Marshall.D.Teach] in hand the Life step still happens; another card is not played', () => {
      const g = start(10, 0, [V.c1]);
      play(g, ID);
      none(g); // an empty "up to 1" choice is still shown
      accept(g);
      expect(names(g, 'p1', 'characters')).toEqual([]);
      expect(g.life('p2')).toBe(2);
    });

    it('"up to 1": the play may be declined, and the Life step may be too', () => {
      const g = start(10, 0);
      play(g, ID);
      none(g);
      decline(g);
      expect(names(g, 'p1', 'characters')).toEqual([]);
      expect(g.life('p2')).toBe(3);
    });
  });

  it('[Trigger] draws 2 cards and trashes 1 card from your hand', () => {
    const g = trig(ID, { leader: OTHER_LEADER, deck: [V.c1, V.c2, V.c3] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toContain(V.c2);
  });
});
