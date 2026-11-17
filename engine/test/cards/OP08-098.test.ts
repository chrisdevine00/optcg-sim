/** OP08-098 Kalgara (Leader). RL-48; QA-OP08 OP08-098. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { GENBO, ids, KAL, SETO, WYPER6, HOLLY } from './helpers-kalgara.ts';

const attack = (g: ReturnType<typeof game>) =>
  g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });

describe('OP08-098 Kalgara', () => {
  it('[DON!! x1] [When Attacking]: plays a {Shandian Warrior} with cost <= DON!! on the field, then Life to hand', () => {
    const g = game(
      {
        leader: { card: KAL, don: 1 },
        hand: [GENBO, SETO, HOLLY],
        life: [V.c2, V.c3, V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    attack(g);
    expectDecision(g, 'choose', 'p1');
    // 4 DON!! on the field: Genbo (3) is legal; Seto (5) is too expensive; Holly is not a Shandian Warrior.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', GENBO)]);
    expect(ids(g.zone('p1', 'characters'))).toEqual([GENBO]);
    // "If you do": the top Life card went to the hand.
    expect(g.life('p1')).toBe(2);
    expect(ids(g.zone('p1', 'hand')).sort()).toEqual([HOLLY, SETO, V.c2].sort());
    expectDecision(g, 'block', 'p2');
  });

  it('the DON!! count includes given DON!! and bounds the cost exactly', () => {
    const g = game(
      {
        leader: { card: KAL, don: 1 },
        hand: [SETO, WYPER6],
        life: [V.c2, V.c3],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    attack(g); // 1 given + 4 in the cost area = 5
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', SETO)]);
    expect(ids(g.zone('p1', 'characters'))).toEqual([SETO]);
    expect(g.life('p1')).toBe(1);
  });

  it('"If you do" is false when nothing is played: no Life card is added to the hand', () => {
    const g = game(
      {
        leader: { card: KAL, don: 1 },
        hand: [GENBO],
        life: [V.c2, V.c3, V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    attack(g);
    none(g);
    expect(g.zone('p1', 'characters')).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(ids(g.zone('p1', 'hand'))).toEqual([GENBO]);
  });

  it('no candidate in hand: nothing happens and no Life card is taken', () => {
    const g = game(
      {
        leader: { card: KAL, don: 1 },
        hand: [SETO],
        life: [V.c2, V.c3, V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    attack(g);
    if (g.legal().some((a) => a.type === 'done')) none(g);
    expect(g.life('p1')).toBe(3);
    expectDecision(g, 'block', 'p2');
  });

  it('needs 1 DON!! given to the Leader: without it the attack has no effect', () => {
    const g = game(
      {
        leader: KAL,
        hand: [GENBO],
        life: [V.c2, V.c3, V.c4],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    attack(g);
    expectDecision(g, 'block', 'p2');
    expect(g.zone('p1', 'characters')).toEqual([]);
    expect(g.life('p1')).toBe(3);
  });

  it('RL-48: usable at 0 Life: the Character is played and the Life part does nothing', () => {
    const g = game(
      {
        leader: { card: KAL, don: 1 },
        hand: [GENBO],
        life: [],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE, life: [PURPLE, PURPLE] },
    );
    attack(g);
    pick(g, [g.find('p1', 'hand', GENBO)]);
    expect(ids(g.zone('p1', 'characters'))).toEqual([GENBO]);
    expect(g.life('p1')).toBe(0);
    expect(g.eventsOfType('GameOver')).toEqual([]);
    expectDecision(g, 'block', 'p2');
  });
});
