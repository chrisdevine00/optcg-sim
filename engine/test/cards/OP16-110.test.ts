/** OP16-110 Vasco Shot. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, V } from './helpers.ts';
import { koByBattle, OTHER_LEADER, trig } from './helpers-op16g4.ts';

const ID = 'OP16-110';

describe('OP16-110 Vasco Shot', () => {
  it("[On K.O.] draws 1 and rests up to 1 of your opponent's Characters with cost 6 or less", () => {
    const g = koByBattle({ leader: OTHER_LEADER, deck: [V.c1, V.c2] }, ID, {
      characters: [V.c6],
    });
    expect(hand(g, 'p1')).toEqual([V.c1]);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
  });

  it('a cost 7 Character is not a candidate', () => {
    // p2's attacker (cost 7) is the only Character: nothing to rest, the draw still happens.
    const g = koByBattle({ leader: OTHER_LEADER, deck: [V.c1, V.c2] }, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expectDecision(g, 'main', 'p2');
  });

  it('"up to 1": may rest nothing', () => {
    const g = koByBattle({ leader: OTHER_LEADER, deck: [V.c1, V.c2] }, ID, {
      characters: [V.c6],
    });
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
  });

  it('[Trigger] activates the [On K.O.] effect', () => {
    const g = trig(ID, { leader: OTHER_LEADER, deck: [V.c1, V.c2] }, [V.c5]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });
});
