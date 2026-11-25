/** OP09-013 Yasopp. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { attackLeader, canPick, finishBattle, mk } from './helpers-a09g1.ts';

const ID = 'OP09-013';

describe('OP09-013 Yasopp', () => {
  it("[On Play]: your Leader gains +1000 power until the end of your opponent's next turn", () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(6000); // p2's turn
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000); // p1's next turn
  });

  it('only your Leader can be chosen (not Characters, not their Leader); "up to 1" may decline', () => {
    const g = mk({ hand: [ID], characters: [V.c1] }, { characters: [V.c1] });
    play(g, ID);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("[DON!! x1] [When Attacking]: -1000 power to up to 1 of your opponent's Characters this turn", () => {
    const g = mk(
      { characters: [{ card: ID, don: 1 }], costArea: { active: 5, rested: 0 } },
      { characters: [V.c4, V.c1] },
    );
    attackLeader(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('"up to 1" in the attack effect may be declined', () => {
    const g = mk(
      { characters: [{ card: ID, don: 1 }], costArea: { active: 5, rested: 0 } },
      { characters: [V.c4] },
    );
    attackLeader(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });

  it('must not fire the attack effect without a DON!! given', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c4] });
    attackLeader(g, g.find('p1', 'characters', ID));
    expect(dec(g)?.kind).toBe('block');
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
  });
});
