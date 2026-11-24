/** OP11-115 You're Just Not My Type! (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, expectDecision, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import {
  canPick,
  counterStep,
  damageGame,
  idsOf,
  SHIRAHOSHI,
  useCounter,
} from './helpers-op11g3.ts';

const ID = 'OP11-115';

describe("OP11-115 You're Just Not My Type!", () => {
  const defend = (leader: string, chars: string[] = []) =>
    counterStep(
      { leader, hand: [ID], characters: chars, costArea: { active: 3, rested: 0 } },
      {},
      V.c5,
    );

  it('[Counter]: with [Shirahoshi] as Leader, up to 1 Leader or Character gains +4000 power during this battle', () => {
    const g = defend(SHIRAHOSHI);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 stops the 7000 attacker
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('can target one of your Characters instead', () => {
    const g = defend(SHIRAHOSHI, [V.c2]);
    useCounter(g, ID);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose nobody', () => {
    const g = defend(SHIRAHOSHI);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(dec(g)?.kind).toBe('counter');
  });

  it('with a Leader that is not [Shirahoshi] the Counter does nothing (the Event is still spent)', () => {
    const g = defend(PLAIN_BLUE);
    useCounter(g, ID);
    expect(dec(g)?.kind).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it("[Trigger]: K.O. up to 1 of your opponent's Characters with a cost of 2 or less (no Leader condition)", () => {
    const g = damageGame(ID, { leader: PLAIN_BLUE }, { characters: [V.c1, V.c2, V.c3] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true); // cost 2: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c7, V.c1, V.c3]);
  });

  it('[Trigger] "up to 1": may K.O. nobody', () => {
    const g = damageGame(ID, { leader: PLAIN_BLUE }, { characters: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });
});
