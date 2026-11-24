/** EB04-027 Boa Hancock. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { canPick, mk, NOTRIG5, RED_LEADER, TRIG5, TRIG6, V } from './helpers-eb04g1.ts';

const ID = 'EB04-027';

describe('EB04-027 Boa Hancock', () => {
  it('[On Play]: draws 2 cards, then trashes 1 card from your hand', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID, V.c5], deck: [V.c1, V.c2, V.c3] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c5, V.c1, V.c2]);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    pick(g, [g.find('p1', 'hand', V.c5)]);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(trash(g, 'p1')).toEqual([V.c5]);
  });

  it('with an empty hand the trash takes one of the drawn cards', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], deck: [V.c1, V.c2, V.c3] });
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  describe('[Trigger]', () => {
    const hit = () =>
      damageGame(ID, { leader: RED_LEADER, hand: [TRIG5, TRIG6, NOTRIG5, V.c5] }, {});

    it('plays a Character with 5000 power or less and a [Trigger] from your hand (6000 power, no [Trigger] and 7000 are out)', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, g.find('p1', 'hand', TRIG5))).toBe(true); // 5000: boundary
      expect(canPick(g, g.find('p1', 'hand', TRIG6))).toBe(false); // 6000
      expect(canPick(g, g.find('p1', 'hand', NOTRIG5))).toBe(false); // no [Trigger]
      expect(canPick(g, g.find('p1', 'hand', V.c5))).toBe(false);
      pick(g, [g.find('p1', 'hand', TRIG5)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([TRIG5]);
    });

    it('"up to 1": may play nothing', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: true });
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });

    it('not activating adds the card to your hand', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: false });
      expect(hand(g, 'p1')).toContain(ID);
      expect(dec(g)?.kind).not.toBe('trigger');
    });
  });
});
