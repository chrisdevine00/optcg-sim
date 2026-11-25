/** OP09-010 Bonk Punch. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { attackLeader, canPick, finishBattle, ids, mk } from './helpers-a09g1.ts';

const ID = 'OP09-010';
const MONSTER = 'OP09-012';
const pw = (g: ReturnType<typeof mk>) => g.power(g.find('p1', 'characters', ID));

describe('OP09-010 Bonk Punch', () => {
  it('[On Play]: plays up to 1 [Monster] from your hand', () => {
    const g = mk({ hand: [ID, MONSTER, V.c3] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', MONSTER)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, MONSTER]);
    expect(hand(g, 'p1')).toEqual([V.c3]);
  });

  it('only a card named [Monster] is offered; "up to 1" may play nothing', () => {
    const g = mk({ hand: [ID, MONSTER, V.c3] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', MONSTER))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1').sort()).toEqual([MONSTER, V.c3].sort());
  });

  it('with no [Monster] in hand nothing is asked of a hand it cannot match', () => {
    const g = mk({ hand: [ID, V.c3] });
    play(g, ID);
    // the pick is asked at 0 (no prompt depends on the hand): either way nothing is played
    if (dec(g)?.kind === 'choose') none(g);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('[DON!! x1] [When Attacking]: +2000 power during this turn (with 1 or more DON!! given)', () => {
    for (const don of [1, 2]) {
      const g = mk({ characters: [{ card: ID, don }], costArea: { active: 5, rested: 0 } });
      expect(pw(g)).toBe(5000 + 1000 * don);
      attackLeader(g, g.find('p1', 'characters', ID));
      expect(pw(g)).toBe(5000 + 1000 * don + 2000);
      finishBattle(g);
      expect(pw(g)).toBe(5000 + 1000 * don + 2000); // still this turn
    }
  });

  it('must not give +2000 without a DON!! given', () => {
    const g = mk({ characters: [ID] });
    attackLeader(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'block', 'p2');
    expect(pw(g)).toBe(5000);
  });

  it('the +2000 is gone next turn', () => {
    const g = mk({ characters: [{ card: ID, don: 1 }], costArea: { active: 5, rested: 0 } });
    attackLeader(g, g.find('p1', 'characters', ID));
    finishBattle(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(pw(g)).toBe(5000); // the given DON!! returned at the Refresh Phase and the +2000 ended
  });
});
