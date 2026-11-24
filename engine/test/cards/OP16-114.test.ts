/** OP16-114 Laffitte. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { koByBattle, names, OTHER_LEADER, trig } from './helpers-op16g4.ts';

const ID = 'OP16-114';

describe('OP16-114 Laffitte', () => {
  it("[On K.O.] K.O.s up to 1 of your opponent's Characters with cost 4 or less", () => {
    const g = koByBattle({ leader: OTHER_LEADER }, ID, { characters: [V.c4, V.c5] });
    // Only the cost 4 Character is a candidate (cost 5 and the cost 7 attacker are not).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(names(g, 'p2', 'characters').sort()).toEqual([V.c5, V.c7].sort());
  });

  it('must not K.O. a cost 5 Character: with no candidate nothing happens', () => {
    const g = koByBattle({ leader: OTHER_LEADER }, ID, { characters: [V.c5] });
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(names(g, 'p2', 'characters')).toEqual([V.c7, V.c5]);
    expectDecision(g, 'main', 'p2');
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = koByBattle({ leader: OTHER_LEADER }, ID, { characters: [V.c4] });
    none(g);
    expect(names(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('[Trigger] activates the [On K.O.] effect', () => {
    const g = trig(ID, { leader: OTHER_LEADER }, [V.c3]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c7]);
  });
});
