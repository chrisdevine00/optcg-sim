/** OP09-039 Gum-Gum Cuatro Jet Cross Shock Bazooka (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  counterStep,
  damageGame,
  dec,
  endCounter,
  expectDecision,
  idsOf,
  none,
  ODYSSEY_LEADER,
  OTHER_LEADER,
  pick,
  rested,
  takeDamage,
  useCounter,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-039';

describe('OP09-039 Gum-Gum Cuatro Jet Cross Shock Bazooka: [Counter]', () => {
  const start = (leader: string, characters: Parameters<typeof counterStep>[0]['characters']) =>
    counterStep({ leader, hand: [ID], characters, costArea: { active: 3, rested: 0 } });

  it('with an ODYSSEY Leader and 2 rested Characters, a Leader or Character gains +2000 power during this turn', () => {
    const g = start(ODYSSEY_LEADER, [rested(V.c1), rested(V.c2), V.c4]);
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    // Leader and Characters of yours are offered; the opponent's cards are not.
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p1', 'characters', V.c4)]);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(8000);
    expectDecision(g, 'counter', 'p1');
  });

  it('the +2000 lasts the whole turn, not only the battle', () => {
    const g = start(ODYSSEY_LEADER, [rested(V.c1), rested(V.c2)]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endCounter(g); // 9000 against 7000: the Leader is hit and the battle ends
    takeDamage(g);
    expectDecision(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('boundary: 1 rested Character is not enough; nothing is asked', () => {
    const g = start(ODYSSEY_LEADER, [rested(V.c1), V.c2]);
    useCounter(g, ID);
    expectDecision(g, 'counter', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('rested Characters of the opponent and active Characters do not count', () => {
    const g = counterStep(
      {
        leader: ODYSSEY_LEADER,
        hand: [ID],
        characters: [rested(V.c1), V.c2],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [rested(V.c3), rested(V.c4)] },
    );
    useCounter(g, ID);
    expectDecision(g, 'counter', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not fire without an ODYSSEY Leader', () => {
    const g = start(OTHER_LEADER, [rested(V.c1), rested(V.c2)]);
    useCounter(g, ID);
    expectDecision(g, 'counter', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose nobody', () => {
    const g = start(ODYSSEY_LEADER, [rested(V.c1), rested(V.c2)]);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(dec(g)?.kind).toBe('counter');
  });
});

describe('OP09-039 Gum-Gum Cuatro Jet Cross Shock Bazooka: [Trigger]', () => {
  it("K.O. up to 1 of your opponent's rested Characters with a cost of 4 or less", () => {
    // p2's attacker (cost 7) is rested by attacking; V.c3 stays active.
    const g = damageGame(
      ID,
      { leader: OTHER_LEADER },
      { characters: [rested(V.c4), rested(V.c5), V.c3, rested(V.c1)] },
    );
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // cost 4: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // cost 5
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // active
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c4]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER }, { characters: [rested(V.c4)] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });
});
