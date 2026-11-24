/** OP14-018 Time for the Counterattack. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, none, pick, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { canPick } from './helpers-w3s.ts';
import { boost, cardsIn, RED0, RED3, RED_LEADER, SN2 } from './helpers-op14g1.ts';

const ID = 'OP14-018';
const p1 = (extra: Record<string, unknown> = {}) => ({
  leader: RED_LEADER,
  hand: [ID],
  costArea: { active: 4, rested: 0 },
  ...extra,
});

describe('OP14-018 Time for the Counterattack', () => {
  it('[Counter] with an 8000-power Character on the field (the attacker): +4000 to up to 1 Leader or Character this battle', () => {
    const g = counterStep(p1(), {}, V.c6); // an 8000 attacker
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 beats the 8000 attacker
  });

  it('boundary: 7000 is not enough (the Counter does nothing), 8000 on your own side is', () => {
    const g = counterStep(p1(), {}, V.c5);
    useCounter(g, ID);
    expectDecision(g, 'counter', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    const h = counterStep(p1({ characters: [V.c6] }), {}, V.c5);
    useCounter(h, ID);
    expectDecision(h, 'choose', 'p1');
  });

  it('reads CURRENT power: a 7000 Character boosted to 8000 counts', () => {
    const g = counterStep(p1({ characters: [V.c5] }), {}, V.c4);
    boost(g, g.find('p1', 'characters', V.c5), 1000, 4);
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
  });

  it('the target may be a Character; "up to 1" may be nobody', () => {
    const g = counterStep(p1({ characters: [V.c1] }), {}, V.c6);
    useCounter(g, ID);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger]: plays up to 1 red Character with 2000 power or less from your hand', () => {
    const g = damageGame(ID, { leader: RED_LEADER, hand: [SN2, RED3, RED0] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', SN2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', RED0))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', RED3))).toBe(false); // 3000
    pick(g, [g.find('p1', 'hand', SN2)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([SN2]);
  });
});
