/** OP14-090 Mr.1(Daz.Bonez). */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import { none, pick, play, V } from './helpers.ts';
import { plant } from './helpers-op15g2.ts';
import { BW_LEADER, COST8, ids, start } from './helpers-op14g4.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'OP14-090';
const attacks = (g: TestGame, attacker: InstanceId) =>
  g.legal().filter((a) => a.type === 'attack' && a.attacker === attacker);

/** p1 plays Daz with `p2chars` on the opponent's field (and `p1chars` on p1's). */
const run = (p2chars: (string | { card: string; rested: boolean })[], p1chars: string[] = []) => {
  const g = start(
    { leader: BW_LEADER, hand: [ID], characters: p1chars, costArea: { active: 5, rested: 0 } },
    { characters: p2chars },
  );
  return g;
};
const target = { card: V.c1, rested: true };

describe('OP14-090 Mr.1(Daz.Bonez)', () => {
  it('with a cost 8 Character on the field it can attack Characters on the turn it is played (not the Leader)', () => {
    const g = run([COST8, target]);
    const id = play(g, ID);
    const a = attacks(g, id);
    expect(a.length).toBeGreaterThan(0);
    expect(a.every((x) => x.type === 'attack' && x.target !== g.leader('p2'))).toBe(true);
    expect(
      a.some((x) => x.type === 'attack' && x.target === g.find('p2', 'characters', V.c1)),
    ).toBe(true);
  });

  it('a cost 8 Character on your own field counts too', () => {
    const g = run([target], [COST8]);
    const id = play(g, ID);
    expect(attacks(g, id).length).toBeGreaterThan(0);
  });

  it('with only a cost 7 Character it cannot attack on the turn it is played', () => {
    const g = run([V.c7, target]);
    const id = play(g, ID);
    expect(attacks(g, id)).toHaveLength(0);
  });

  it('a cost 0 Character (a cost reduction) also enables it, and [On Play] rests only a cost 0 Character', () => {
    const g = run([target, V.c2]);
    // A planted effect stands for any "-1 cost" source: the cost 1 Character becomes cost 0.
    plant(g, 'p1', {
      cost: {
        target: { from: 'characters', owner: 'opponent', filter: { cost: { eq: 1 } } },
        amount: -1,
        duration: 'thisTurn',
      },
    });
    const id = play(g, ID);
    // The cost 0 Character (already rested) is the [On Play] target: decline, the attack stays open.
    none(g);
    expect(attacks(g, id).length).toBeGreaterThan(0);
  });

  it('[On Play] rests an active cost 0 Character of the opponent, not a cost 1 or cost 2 one', () => {
    const g = run([V.c1, V.c2]);
    plant(g, 'p1', {
      cost: {
        target: { from: 'characters', owner: 'opponent', filter: { cost: { eq: 1 } } },
        amount: -1,
        duration: 'thisTurn',
      },
    });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').find((c) => c.card === V.c1)!.rested).toBe(true);
    expect(g.zone('p2', 'characters').find((c) => c.card === V.c2)!.rested).toBe(false);
  });

  it('[On Play] "up to 1": may rest nothing; with no cost 0 Character nothing is offered to rest', () => {
    const g = run([V.c1, V.c2]);
    play(g, ID);
    // No Character has cost 0: no valid target, so the step finds nothing and the turn goes on.
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1, V.c2]);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });
});
