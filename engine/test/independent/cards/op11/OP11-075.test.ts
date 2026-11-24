/**
 * OP11-075 Jaguar.D.Saul (Character, Blue?, cost 6, 6000, {Giant}/{Former Navy}/{Ohara}).
 *
 * Card text: "[On Play] If your Leader is [Nico Robin] and you have 7 or more DON!! cards on your
 * field, draw 2 cards. [Trigger] Activate this card's [On Play] effect."
 *
 * Rules: RL-23 (DON!! on the field = cost area, active or rested, plus DON!! given to cards),
 * CR 8-3-2 (an "If" condition is checked when the effect resolves), CR 10-1-5 ([Trigger]; a
 * Character activated this way is not played, it goes to the trash after resolving).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  cnt,
  declineTrigger,
  donField,
  hand,
  hitLeader,
  kind,
  LD11,
  lifeCards,
  me,
  playRaw,
  SC11,
  them,
  trash,
} from './kit-op11c.ts';

const ID = 'OP11-075';

function play(o: { leader?: string; active: number; rested?: number; leaderDon?: number }) {
  const g = me(
    o.leaderDon ? { card: o.leader ?? LD11.robin, don: o.leaderDon } : (o.leader ?? LD11.robin),
    { hand: [ID, SC11.r1], costArea: { active: o.active, rested: o.rested ?? 0 } },
    {},
  );
  playRaw(g, ID);
  return g;
}

describe('OP11-075 Jaguar.D.Saul: draw 2 with [Nico Robin] and 7+ DON!!', () => {
  it('printed effect: [Nico Robin] Leader and 7 DON!! on the field after paying 6: draws 2', () => {
    const g = play({ active: 7 });
    expect(donField(g)).toBe(7);
    expect(cnt(g, 'p1', 'hand')).toBe(1 + 2);
    expect(kind(g)).toBe('main');
  });

  it('boundary: 6 DON!! on the field (all rested paying the cost) is not enough', () => {
    const g = play({ active: 6 });
    expect(donField(g)).toBe(6);
    expect(cnt(g, 'p1', 'hand')).toBe(1);
  });

  it('rested DON!! count: 4 active + 3 already rested, 6 paid from the active ones, 7 on the field', () => {
    const g = play({ active: 6, rested: 1 });
    expect(donField(g)).toBe(7);
    expect(cnt(g, 'p1', 'hand')).toBe(1 + 2);
  });

  it('DON!! given to my Leader count towards the 7', () => {
    const g = play({ active: 6, leaderDon: 1 });
    expect(donField(g)).toBe(7);
    expect(cnt(g, 'p1', 'hand')).toBe(1 + 2);
  });

  it('a Leader that is not [Nico Robin] draws nothing, even with 10 DON!!', () => {
    const g = play({ leader: LD11.plain, active: 10 });
    expect(cnt(g, 'p1', 'hand')).toBe(1);
  });

  it('draws exactly 2 cards, from the top of my deck', () => {
    const g = me(LD11.robin, {
      hand: [ID],
      costArea: { active: 10, rested: 0 },
      deck: [SC11.r2, SC11.r3, SC11.r4],
    });
    playRaw(g, ID);
    expect(hand(g)).toEqual([SC11.r2, SC11.r3].sort());
  });

  it('the played Saul stays on the field as a Character', () => {
    const g = play({ active: 10 });
    expect(g.card(at(g, 'p1', 'characters', ID)).zone).toBe('characters');
  });

  it('[Trigger]: activating it from the Life row draws 2 when the condition holds, and Saul is not played', () => {
    const g = them(
      LD11.robin,
      { life: [ID, SC11.r1, SC11.r2], costArea: { active: 7, rested: 0 } },
      {},
    );
    const handBefore = cnt(g, 'p1', 'hand');
    hitLeader(g);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(cnt(g, 'p1', 'hand')).toBe(handBefore + 2);
    expect(cnt(g, 'p1', 'characters')).toBe(0);
    expect(trash(g)).toContain(ID);
  });

  it('[Trigger] with the condition false (6 DON!!): activating draws nothing', () => {
    const g = them(
      LD11.robin,
      { life: [ID, SC11.r1, SC11.r2], costArea: { active: 6, rested: 0 } },
      {},
    );
    const handBefore = cnt(g, 'p1', 'hand');
    hitLeader(g);
    activateTrigger(g);
    expect(cnt(g, 'p1', 'hand')).toBe(handBefore);
  });

  it('[Trigger] declined: Saul goes to my hand and nothing is drawn', () => {
    const g = them(
      LD11.robin,
      { life: [ID, SC11.r1, SC11.r2], costArea: { active: 10, rested: 0 } },
      {},
    );
    const handBefore = cnt(g, 'p1', 'hand');
    hitLeader(g);
    declineTrigger(g);
    expect(cnt(g, 'p1', 'hand')).toBe(handBefore + 1);
    expect(hand(g)).toContain(ID);
    expect(lifeCards(g)).toHaveLength(2);
  });

  it('[Trigger] with a non-[Nico Robin] Leader draws nothing', () => {
    const g = them(
      LD11.plain,
      { life: [ID, SC11.r1, SC11.r2], costArea: { active: 10, rested: 0 } },
      {},
    );
    const handBefore = cnt(g, 'p1', 'hand');
    hitLeader(g);
    activateTrigger(g);
    expect(cnt(g, 'p1', 'hand')).toBe(handBefore);
  });
});
