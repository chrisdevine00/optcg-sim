/** OP11-079 When Two Men Are Fighting the Last Thing I Need Is Some Half-Hearted Assistance!!!!. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, V } from './helpers.ts';
import {
  counterAttack,
  finishBattle,
  nameCost,
  offeredPicks,
  triggerGame,
} from './helpers-w5c2.ts';

const ID = 'OP11-079';

describe('OP11-079 When Two Men Are Fighting ...', () => {
  it('[Counter]: on a match, a Leader gains +5000 power during this battle (and the attack fails)', () => {
    const g = counterAttack(ID, V.c3, { characters: [V.c1] });
    nameCost(g, 3);
    expect(offeredPicks(g).sort()).toEqual(
      [g.leader('p1'), g.find('p1', 'characters', V.c1)].sort(),
    );
    g.act({ type: 'pick', choice: g.leader('p1') });
    expect(g.power(g.leader('p1'))).toBe(10000);
    expect(g.zone('p2', 'deck')[0]!.card).toBe(V.c3);
    finishBattle(g);
    expect(g.life('p1')).toBe(3); // 10000 stops the 7000 attacker
    // The boost ended with the battle.
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('on a miss nothing is asked and the attack lands', () => {
    const g = counterAttack(ID, V.c3, { characters: [V.c1] });
    nameCost(g, 4);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(5000);
    finishBattle(g);
    expect(g.life('p1')).toBe(2);
  });

  it('can boost a Character instead, and "up to 1" may be declined', () => {
    const g = counterAttack(ID, V.c3, { characters: [V.c1] });
    nameCost(g, 3);
    g.act({ type: 'pick', choice: g.find('p1', 'characters', V.c1) });
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);

    const h = counterAttack(ID, V.c3);
    nameCost(h, 3);
    h.act({ type: 'done' });
    expect(h.power(h.leader('p1'))).toBe(5000);
  });

  it('an Event on top of the deck matches its own printed cost', () => {
    // EVENT cost 2 on top of the deck: naming 2 matches, naming 3 does not.
    const hit = counterAttack(ID, 'ST02-017');
    nameCost(hit, 2);
    expect(offeredPicks(hit)).toEqual([hit.leader('p1')]);
    const miss = counterAttack(ID, 'ST02-017');
    nameCost(miss, 3);
    expect(dec(miss)?.kind).not.toBe('choose');
  });

  it('[Trigger]: draw 1 card', () => {
    const g = triggerGame(ID, { hand: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c1, 'OP02-060']); // p1's deck top (BLUE)
    expectDecision(g, 'main', 'p2');
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
  });
});
