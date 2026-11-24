/** EB04-021 Igaram. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, hand, pick, play, trash } from './helpers.ts';
import { activateAb, at, canActivate, mk, RED_LEADER, V, VIVI_LEADER } from './helpers-eb04g1.ts';

const ID = 'EB04-021';
const deck = [V.c1, V.c2, V.c3, V.c4];

describe('EB04-021 Igaram', () => {
  it('[On Play] with [Nefeltari Vivi] as Leader: draws 2 cards, then trashes 1 card from your hand', () => {
    const g = mk({ leader: VIVI_LEADER, hand: [ID], deck });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('the trash is mandatory (no "none" offered)', () => {
    const g = mk({ leader: VIVI_LEADER, hand: [ID], deck });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('with any other Leader nothing is drawn or trashed', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], deck });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expect(dec(g)?.kind).toBe('main');
  });

  describe('[Activate: Main] [Once Per Turn]', () => {
    const start = (restedDon = 2, h: string[] = [V.c1]) =>
      mk({
        leader: RED_LEADER,
        hand: h,
        characters: [ID, V.c3],
        costArea: { active: 3, rested: restedDon },
      });

    it('you may trash 1 card from your hand: give up to 1 rested DON!! to your Leader or 1 of your Characters', () => {
      const g = start();
      activateAb(g, at(g, 'p1', 'characters', ID), 'give-don');
      pick(g, [g.find('p1', 'hand', V.c1)]); // the cost
      expectDecision(g, 'choose', 'p1');
      pick(g, [at(g, 'p1', 'characters', V.c3)]);
      expect(g.card(at(g, 'p1', 'characters', V.c3)).don).toBe(1);
      expect(don(g, 'p1')).toMatchObject({ rested: 1, given: 1 });
      expect(trash(g, 'p1')).toEqual([V.c1]);
    });

    it('the Leader is a legal target too', () => {
      const g = start();
      activateAb(g, at(g, 'p1', 'characters', ID), 'give-don');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      pick(g, [g.leader('p1')]);
      expect(g.card(g.leader('p1')).don).toBe(1);
    });

    it('with no hand card the cost cannot be paid: not offered', () => {
      const g = start(2, []);
      expect(canActivate(g, at(g, 'p1', 'characters', ID), 'give-don')).toBe(false);
    });

    it('with no rested DON!! the cost is still paid and nothing is given', () => {
      const g = start(0);
      activateAb(g, at(g, 'p1', 'characters', ID), 'give-don');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(trash(g, 'p1')).toEqual([V.c1]);
      expect(don(g, 'p1').given).toBe(0);
    });

    it('Once Per Turn: not offered again', () => {
      const g = start(2, [V.c1, V.c2]);
      const id = at(g, 'p1', 'characters', ID);
      activateAb(g, id, 'give-don');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      pick(g, [g.leader('p1')]);
      expect(canActivate(g, id, 'give-don')).toBe(false);
    });
  });
});
