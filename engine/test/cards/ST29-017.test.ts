/** ST29-017 Iai Death Lion Song. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, hand, none, pick, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { canPick, cardsIn, lifeOf, LUFFY_LEADER } from './helpers-st29old.ts';

const ID = 'ST29-017';
const p1 = (life: number, extra: Record<string, unknown> = {}) => ({
  leader: LUFFY_LEADER,
  hand: [ID],
  life: lifeOf(life),
  costArea: { active: 4, rested: 0 },
  ...extra,
});

describe('ST29-017 Iai Death Lion Song', () => {
  it('[Counter]: +4000 power during this battle to a Leader or Character', () => {
    const g = counterStep(p1(3), {}, V.c7); // a 9000 attacker
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 stops a 9000 attacker
  });

  it('with 2 or less Life: also K.O.s up to 1 opposing Character with a cost of 3 or less', () => {
    const g = counterStep(p1(2), { characters: [V.c3, V.c4] }, V.c5);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // cost 4
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c4, V.c5].sort());
  });

  it('boundary: with 3 Life there is no K.O.', () => {
    const g = counterStep(p1(3), { characters: [V.c3] }, V.c5);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'counter', 'p1');
    expect(cardsIn(g, 'p2', 'characters')).toContain(V.c3);
  });

  it('"Then, if": declining the boost target still K.O.s at 0 Life', () => {
    const g = counterStep(p1(0), { characters: [V.c3] }, V.c5);
    useCounter(g, ID);
    none(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(cardsIn(g, 'p2', 'characters')).not.toContain(V.c3);
  });

  it('[Trigger]: draws 2 cards, then trashes 1 card from your hand', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, hand: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(cardsIn(g, 'p1', 'trash')).toContain(V.c1);
  });
});
