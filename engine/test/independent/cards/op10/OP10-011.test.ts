/**
 * OP10-011 Tony Tony.Chopper (Character, Red, cost 4, 4000, Counter +2000, {Straw Hat Crew}/{Punk
 * Hazard}, [Blocker]).
 *
 * Card text: "[Blocker] [Opponent's Turn] This Character gains +2000 power."
 *
 * Rules: [Blocker] is printed (a verified override supplies the keyword). [Opponent's Turn] is a
 * static bonus that applies only on the opponent's turn. Given DON!! add +1000 on my turn only
 * (RL-13), so on the opponent's turn the printed bonus is the only one.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  cardIds,
  kind,
  mine,
  need,
  noDefence,
  passCounter,
  theirs,
  VAN,
} from './kit-op10a.ts';

const CHOPPER = 'OP10-011';

/** p2's turn: p2's `attackerCard` attacks my Leader and p1 blocks with Chopper (rested or not). */
function blocked(attackerCard: string) {
  const g = theirs('ST01-001', { characters: [CHOPPER] }, { characters: [attackerCard] });
  attack(g, at(g, 'p2', 'characters', attackerCard), g.leader('p1'));
  need(g, 'block', 'p1');
  g.act({ type: 'block', blocker: at(g, 'p1', 'characters', CHOPPER) });
  return g;
}

describe("OP10-011 Tony Tony.Chopper: [Blocker]; [Opponent's Turn] +2000 power", () => {
  it('printed values: cost 4, 4000, Counter +2000, [Blocker]', () => {
    const g = mine('ST01-001', { hand: [CHOPPER] });
    const c = g.find('p1', 'hand', CHOPPER);
    expect(g.card(c).cost).toBe(4);
    expect(g.card(c).counter).toBe(2000);
    expect(g.card(c).keywords).toContain('Blocker');
    expect(g.power(c)).toBe(4000);
  });

  it('on my turn it has its printed 4000 power', () => {
    const g = mine('ST01-001', { characters: [CHOPPER] });
    expect(g.power(at(g, 'p1', 'characters', CHOPPER))).toBe(4000);
  });

  it("on the opponent's turn it has 6000 power", () => {
    const g = theirs('ST01-001', { characters: [CHOPPER] });
    expect(g.power(at(g, 'p1', 'characters', CHOPPER))).toBe(6000);
  });

  it("given DON!! adds nothing on the opponent's turn: still 6000 with 2 DON!! given", () => {
    const g = theirs('ST01-001', {
      costArea: { active: 0, rested: 0 },
      characters: [{ card: CHOPPER, don: 2 }],
      donDeck: 8,
    });
    expect(g.power(at(g, 'p1', 'characters', CHOPPER))).toBe(6000);
  });

  it("on my turn given DON!! add +1000 each and the opponent's-turn bonus is absent: 6000 with 2 DON!!", () => {
    const g = mine('ST01-001', {
      costArea: { active: 8, rested: 0 },
      characters: [{ card: CHOPPER, don: 2 }],
    });
    expect(g.power(at(g, 'p1', 'characters', CHOPPER))).toBe(6000);
  });

  it('[Blocker]: it can block an attack on my Leader', () => {
    const g = theirs('ST01-001', { characters: [CHOPPER] }, { characters: [VAN.marco] });
    attack(g, at(g, 'p2', 'characters', VAN.marco), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', CHOPPER)]);
  });

  it('boundary in battle: blocking a 5000 attacker, Chopper (6000) survives', () => {
    const g = blocked(VAN.marco);
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([CHOPPER]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.marco]);
    expect(kind(g)).toBe('main');
  });

  it("boundary in battle: blocking a 6000 attacker, Chopper (6000) is K.O.'d (ties go to the attacker)", () => {
    const g = blocked(VAN.hajrudin);
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('the bonus stacks with a Counter: a 7000 attacker beats a +1000 Counter (7000, tie) but not a +2000 one (8000)', () => {
    const run = (counterCard: string) => {
      const g = theirs(
        'ST01-001',
        { characters: [CHOPPER], hand: [counterCard] },
        { characters: [VAN.kingdew] },
      );
      attack(g, at(g, 'p2', 'characters', VAN.kingdew), g.leader('p1'));
      g.act({ type: 'block', blocker: at(g, 'p1', 'characters', CHOPPER) });
      need(g, 'counter', 'p1');
      g.act({
        type: 'counter',
        card: at(g, 'p1', 'hand', counterCard),
        target: at(g, 'p1', 'characters', CHOPPER),
      });
      passCounter(g);
      return cardIds(g, 'p1', 'characters');
    };
    // OP01-018 Hajrudin has Counter +1000; OP12-103 Seto (Yellow, cost 5, 6000) has Counter +2000.
    expect(run(VAN.hajrudin)).toEqual([]);
    expect(run('OP12-103')).toEqual([CHOPPER]);
  });

  it('on my own turn it is only 4000: attacking a rested 5000 Character does not K.O. it', () => {
    const g = mine(
      'ST01-001',
      { characters: [CHOPPER] },
      { characters: [{ card: VAN.marco, rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', CHOPPER), at(g, 'p2', 'characters', VAN.marco));
    noDefence(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.marco]);
  });
});
