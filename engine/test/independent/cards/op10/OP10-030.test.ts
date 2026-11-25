/**
 * OP10-030 Smoker (Character, Green, cost 5, 7000, no Counter, {Navy}/{Punk Hazard}, [Banish]).
 *
 * Card text: "[Banish] [Activate: Main] Set up to 1 of your DON!! cards as active. Then, you cannot set
 * DON!! cards as active using Character effects during this turn."
 *
 * Rules: [Banish] (CR 10-1-3-1): a Life card hit by this Character's attack is trashed, its [Trigger]
 * does not activate. The Activate has no cost and no Once Per Turn; "set up to 1 DON!!" asks a count
 * (DECISIONS OP-14 R2). The restriction is about DON!! being set active by Character effects: Leader
 * effects, rules (Refresh) and other kinds of effects are not stopped (M6b-Q47: whose Character
 * effects is open, so only my own Characters are asserted).
 */
import { describe, expect, it } from 'vitest';
import {
  askedCount,
  at,
  attack,
  cardIds,
  don,
  hand,
  kind,
  mine,
  need,
  noDefenceUntilTrigger,
  offeredAbilities,
  pickCount,
  playRaw,
  useAbility,
  VAN,
} from './kit-op10a.ts';

const SMOKER = 'OP10-030';
/** OP14-024 Kin'emon: Green, cost 4, 5000. [On Play] Set up to 3 of your DON!! cards as active. Then, you cannot play Character cards during this turn. */
const KINEMON = 'OP14-024';

describe('OP10-030 Smoker: [Banish]; [Activate: Main] set up to 1 DON!! active, then no DON!! set active by Character effects this turn', () => {
  it('printed values: cost 5, 7000, no Counter, [Banish]', () => {
    const g = mine('ST01-001', { hand: [SMOKER] });
    const c = g.find('p1', 'hand', SMOKER);
    expect(g.card(c).cost).toBe(5);
    expect(g.power(c)).toBe(7000);
    expect(g.card(c).counter ?? null).toBeNull();
    expect(g.card(c).keywords).toContain('Banish');
  });

  it('[Banish]: the Life card it hits is trashed and its [Trigger] is not offered', () => {
    const g = mine(
      'ST01-001',
      { characters: [SMOKER] },
      { life: ['OP12-104', VAN.sai, VAN.sai, VAN.sai] },
    );
    attack(g, at(g, 'p1', 'characters', SMOKER), g.leader('p2'));
    noDefenceUntilTrigger(g);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'life')).toHaveLength(3);
    expect(cardIds(g, 'p2', 'trash')).toEqual(['OP12-104']);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('[Activate: Main]: asks how many (up to 1) and sets 1 rested DON!! active', () => {
    const g = mine('ST01-001', { costArea: { active: 6, rested: 4 }, characters: [SMOKER] });
    useAbility(g, at(g, 'p1', 'characters', SMOKER));
    need(g, 'choose', 'p1');
    expect(askedCount(g)).toBe(true);
    pickCount(g, 1);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": none is allowed and sets nothing', () => {
    const g = mine('ST01-001', { costArea: { active: 6, rested: 4 }, characters: [SMOKER] });
    useAbility(g, at(g, 'p1', 'characters', SMOKER));
    pickCount(g, 0);
    expect(don(g)).toMatchObject({ active: 6, rested: 4 });
  });

  it('there is no Once Per Turn: it can be activated again, but its own restriction now stops the second set', () => {
    const g = mine('ST01-001', { costArea: { active: 6, rested: 4 }, characters: [SMOKER] });
    useAbility(g, at(g, 'p1', 'characters', SMOKER));
    pickCount(g, 1);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', SMOKER))).toHaveLength(1);
    useAbility(g, at(g, 'p1', 'characters', SMOKER));
    if (askedCount(g)) pickCount(g, 1);
    expect(kind(g)).toBe('main');
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it("control: without Smoker's activation, Kin'emon's [On Play] sets rested DON!! active", () => {
    const g = mine('ST01-001', { hand: [KINEMON], costArea: { active: 4, rested: 6 } });
    playRaw(g, KINEMON);
    if (askedCount(g)) pickCount(g, 3);
    // Kin'emon cost 4 rested 4 more; 3 of the rested ones were set active.
    expect(don(g).active).toBeGreaterThanOrEqual(3);
  });

  it("afterwards a Character effect of mine cannot set DON!! active: Kin'emon's [On Play] sets none", () => {
    const g = mine('ST01-001', {
      hand: [KINEMON],
      costArea: { active: 5, rested: 5 },
      characters: [SMOKER],
    });
    useAbility(g, at(g, 'p1', 'characters', SMOKER));
    pickCount(g, 0);
    playRaw(g, KINEMON);
    // Whatever the engine asks for the "set up to 3", no rested DON!! becomes active: 5 active - 4 paid.
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      if (askedCount(g)) g.act({ type: 'pick', choice: { option: '3' } });
      else if (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
      else break;
    }
    expect(don(g)).toMatchObject({ active: 1, rested: 9 });
  });

  it("the restriction needs Smoker's activation: it is not there at the start of the turn", () => {
    const g = mine('ST01-001', {
      hand: [KINEMON],
      costArea: { active: 5, rested: 5 },
      characters: [SMOKER],
    });
    playRaw(g, KINEMON);
    if (askedCount(g)) pickCount(g, 3);
    expect(don(g).active).toBe(4);
  });

  it('the restriction is limited to Character effects: my Leader can still set DON!! active (Smoker Leader OP10-001)', () => {
    const g = mine('OP10-001', { costArea: { active: 5, rested: 5 }, characters: [SMOKER] });
    useAbility(g, at(g, 'p1', 'characters', SMOKER));
    pickCount(g, 0);
    useAbility(g, g.leader('p1'));
    pickCount(g, 2);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it('with no rested DON!! the activation is still allowed and nothing is set active', () => {
    const g = mine('ST01-001', { costArea: { active: 10, rested: 0 }, characters: [SMOKER] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', SMOKER))).toHaveLength(1);
    useAbility(g, at(g, 'p1', 'characters', SMOKER));
    if (askedCount(g)) pickCount(g, 0);
    expect(don(g)).toMatchObject({ active: 10, rested: 0 });
  });
});
