/** OP13-077 Go All the Way to the Top!! */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, endCounter, expectDecision, pick, play, V } from './helpers.ts';
import {
  canPick,
  counterStep,
  idsOf,
  mine,
  OTHER_LEADER,
  useCounter,
  withDon,
} from './helpers-op13g3.ts';

const ID = 'OP13-077';

describe('OP13-077 Go All the Way to the Top!!', () => {
  const start = (given: boolean, opp: string[]) =>
    mine(
      { leader: given ? withDon(OTHER_LEADER) : OTHER_LEADER, hand: [ID] },
      { characters: opp },
      6,
    );

  it('[Main] you may rest 3 DON!!: with DON!! given, K.O. up to 1 Character with 4000 base power or less and up to 1 with 3000 or less', () => {
    const g = start(true, [V.c1, V.c2, V.c3]);
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
    // First pick: 4000 or less (cost-2 4000 and cost-1 3000); the 5000 one is out.
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    // Second pick: 3000 or less.
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'trash').sort()).toEqual([V.c1, V.c2].sort());
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c3]);
  });

  it('boundary: a 4000-base Character is not a target of the 3000 pick', () => {
    const g = start(true, [V.c2]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c2]);
  });

  it('M6b-Q6: choosing the 3000 Character with the first pick forfeits the second when no other is in range', () => {
    const g = start(true, [V.c1, V.c2]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c2]);
  });

  it("with no DON!! given the 3 DON!! are rested and nothing is K.O.'d", () => {
    const g = start(false, [V.c1]);
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });

  it('declining the cost does nothing', () => {
    const g = start(true, [V.c1]);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 1 });
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('[Counter]: your Leader gains +3000 power during this turn (still there after the battle)', () => {
    const g = counterStep({ leader: OTHER_LEADER, hand: [ID], costArea: { active: 1, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });
});
