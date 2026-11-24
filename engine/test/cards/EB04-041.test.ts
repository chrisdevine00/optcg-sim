/** EB04-041 Stealth Black: [Main] with [Sanji] as Leader and 4 or more DON!! on your field, play up to 1 [Sanji] with 6000 power or less from hand or trash; [Trigger] draw 2, trash 1. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import {
  canPick,
  ids,
  mine,
  OTHER_LEADER,
  SANJI1,
  SANJI8,
  SANJI_LEADER,
  triggerHit,
} from './helpers-eb04g2.ts';

const ID = 'EB04-041';

/** `field` DON!! on the field in total (the Event itself costs 3, paid from the cost area). */
const setup = (leader: string, field: number, handCards: string[], trash: string[]) =>
  mine({ leader, hand: [ID, ...handCards], trash, costArea: { active: field, rested: 0 } });

describe('EB04-041 Stealth Black', () => {
  it('plays a [Sanji] from the hand', () => {
    const g = setup(SANJI_LEADER, 4, [SANJI1], []);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', SANJI1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([SANJI1]);
  });

  it('plays a [Sanji] from the trash; one choice across both zones', () => {
    const g = setup(SANJI_LEADER, 4, [SANJI1], [SANJI1]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', SANJI1))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', SANJI1))).toBe(true);
    pick(g, [g.find('p1', 'trash', SANJI1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([SANJI1]);
    expect(ids(g, 'p1', 'hand')).toEqual([SANJI1]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('6000 power or less: a 9000 [Sanji] is not offered, and a different name is not either', () => {
    const g = setup(SANJI_LEADER, 4, [SANJI8, V.c4], [SANJI8]);
    play(g, ID);
    if (g.legal().some((a) => a.type === 'pick')) {
      expect(canPick(g, g.find('p1', 'hand', SANJI8))).toBe(false);
      expect(canPick(g, g.find('p1', 'trash', SANJI8))).toBe(false);
      expect(canPick(g, g.find('p1', 'hand', V.c4))).toBe(false);
    }
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('the DON!! count is exact: 4 on the field is enough, 3 is not (the Event is played with the cost area)', () => {
    // Paying the Event rests DON!! but they stay on the field: 4 on the field is enough.
    const ok = setup(SANJI_LEADER, 4, [SANJI1], []);
    play(ok, ID);
    expect(ok.legal().some((a) => a.type === 'pick')).toBe(true);
    // 3 DON!! only pays the Event: the field has 3, below 4.
    const no = setup(SANJI_LEADER, 3, [SANJI1], []);
    play(no, ID);
    expectDecision(no, 'main', 'p1');
    expect(ids(no, 'p1', 'characters')).toEqual([]);
  });

  it('without [Sanji] as Leader nothing is played', () => {
    const g = setup(OTHER_LEADER, 5, [SANJI1], []);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] draw 2 cards and trash 1 card from your hand', () => {
    const g = triggerHit(ID, { hand: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(ids(g, 'p1', 'trash')).toContain(V.c1);
  });
});
