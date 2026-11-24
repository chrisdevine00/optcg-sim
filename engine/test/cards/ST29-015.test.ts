/** ST29-015 Raw Heat Strike. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, hand, none, pick, takeDamage, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { canPick, cardsIn, lifeOf, LUFFY_LEADER } from './helpers-st29old.ts';

const ID = 'ST29-015';
const p1 = (life: number, extra: Record<string, unknown> = {}) => ({
  leader: LUFFY_LEADER,
  hand: [ID],
  life: lifeOf(life),
  costArea: { active: 4, rested: 0 },
  ...extra,
});

describe('ST29-015 Raw Heat Strike', () => {
  it('[Counter]: +2000 power during this battle to a Leader or Character', () => {
    const g = counterStep(p1(3), {}, V.c6); // an 8000 attacker
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g);
    takeDamage(g);
    expect(g.life('p1')).toBe(2); // 7000 loses to 8000
    expect(g.power(g.leader('p1'))).toBe(5000); // the boost ended with the battle
  });

  it('with 1 or less Life: also gives up to 1 opposing Leader or Character -2000 this turn', () => {
    const g = counterStep(p1(1, { characters: [V.c1] }), { characters: [V.c3] }, V.c4);
    useCounter(g, ID);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(3000);
  });

  it('boundary: with 2 Life the -2000 is not given (no second decision)', () => {
    const g = counterStep(p1(2), { characters: [V.c3] }, V.c4);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'counter', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('"Then, if": declining the +2000 target still allows the -2000 at 0 Life', () => {
    const g = counterStep(p1(0), { characters: [V.c3] }, V.c4);
    useCounter(g, ID);
    none(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger]: draws 1 card', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([ID]);
  });
});
