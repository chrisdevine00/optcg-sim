/** ST26-001 Soba Mask. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, hand, play, V } from './helpers.ts';
import {
  mk,
  playable,
  PURPLE_8000,
  SAN_GOROU_8000,
  SANJI_3000,
  SANJI_6000,
  SANJI_7000,
} from './helpers-st2627.ts';

const ID = 'ST26-001';
/** Printed cost 7: with exactly 2 active DON!! it is only playable when the -5 applies. */
const start = (chars: (string | { card: string; don: number })[], active = 2) =>
  mk({ hand: [ID], characters: chars, costArea: { active, rested: 0 } });
const charNames = (g: ReturnType<typeof mk>, p: 'p1' | 'p2') =>
  g
    .zone(p, 'characters')
    .map((c) => c.card)
    .sort();

describe('ST26-001 Soba Mask', () => {
  describe('cost reduction in hand', () => {
    it('costs 5 less with a [San-Gorou] with 8000 base power', () => {
      const g = start([SAN_GOROU_8000]);
      expect(playable(g, g.find('p1', 'hand', ID))).toBe(true);
    });

    it('the base power threshold is inclusive at 7000 ([Sanji] 7000) and 6000 is not enough', () => {
      const ok = start([SANJI_7000]);
      expect(playable(ok, ok.find('p1', 'hand', ID))).toBe(true);
      const no = start([SANJI_6000]);
      expect(playable(no, no.find('p1', 'hand', ID))).toBe(false);
    });

    it('reads BASE power: a 6000 [Sanji] with a DON!! given (7000 current) does not count', () => {
      const g = start([{ card: SANJI_6000, don: 1 }], 3);
      const sanji = g.find('p1', 'characters', SANJI_6000);
      expect(g.power(sanji)).toBe(7000);
      expect(playable(g, g.find('p1', 'hand', ID))).toBe(false);
    });

    it('a Character with 8000 power that is neither [San-Gorou] nor [Sanji] does not count', () => {
      const g = start([PURPLE_8000, SANJI_3000]);
      expect(playable(g, g.find('p1', 'hand', ID))).toBe(false);
    });

    it("an opponent's [San-Gorou] does not count", () => {
      const g = mk(
        { hand: [ID], costArea: { active: 2, rested: 0 } },
        { characters: [SAN_GOROU_8000] },
      );
      expect(playable(g, g.find('p1', 'hand', ID))).toBe(false);
    });

    it('without the condition it costs 7, with it exactly 2 DON!! are rested', () => {
      const six = start([], 6);
      expect(playable(six, six.find('p1', 'hand', ID))).toBe(false);
      const seven = start([], 7);
      expect(playable(seven, seven.find('p1', 'hand', ID))).toBe(true);
      const g = start([SANJI_7000], 4);
      play(g, ID);
      expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 2 });
    });

    it('the discount applies in the hand only: on the field it still has cost 7', () => {
      const g = mk({ characters: [ID, SANJI_7000] });
      expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(7);
    });
  });

  describe('[On Play]', () => {
    it('returns all of your [San-Gorou] and [Sanji] Characters to your hand and leaves the others', () => {
      const g = start([SAN_GOROU_8000, SANJI_7000, SANJI_3000, V.c2], 2);
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect([...hand(g, 'p1')].sort()).toEqual([SAN_GOROU_8000, SANJI_3000, SANJI_7000].sort());
      expect(charNames(g, 'p1')).toEqual([ID, V.c2].sort());
    });

    it("does not touch the opponent's [Sanji] and asks nothing", () => {
      const g = mk(
        { hand: [ID], characters: [SANJI_7000], costArea: { active: 7, rested: 0 } },
        { characters: [SANJI_6000] },
      );
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(charNames(g, 'p2')).toEqual([SANJI_6000]);
      expect(hand(g, 'p1')).toEqual([SANJI_7000]);
    });

    it('with none of them it resolves quietly', () => {
      const g = mk({ hand: [ID], characters: [V.c3], costArea: { active: 7, rested: 0 } });
      play(g, ID);
      expectDecision(g, 'main', 'p1');
      expect(charNames(g, 'p1')).toEqual([ID, V.c3].sort());
    });
  });
});
