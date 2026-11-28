/**
 * OP18-012 Pincers (Red Character, cost 1, 0 power, {Animal}/{Alabasta}).
 *
 * Card text (cards/data):
 *   "[When Attacking] Up to 1 of your Characters with both the {Animal} and {Alabasta} types gains
 *    +1000 power during this turn."
 *
 * Reading: on attack, "up to 1" of your Characters with both types (Pincers itself qualifies), +1000
 * until end of turn. Leaders are not Characters.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import { at, endBattle, LC, mine, need, none, offeredIds, pickCards, VC } from './kit-c.ts';

const PINCERS = 'OP18-012';

function swing(extra: string[] = [VC.karoo1, VC.sanji1]) {
  const g = mine(LC.vivi, { characters: [PINCERS, ...extra] });
  attack(g, at(g, 'p1', 'characters', PINCERS), g.leader('p2'));
  return g;
}

describe('OP18-012 Pincers: [When Attacking] +1000 to an {Animal}/{Alabasta} Character', () => {
  it('gives +1000 to a Karoo', () => {
    const g = swing();
    need(g, 'choose', 'p1');
    pickCards(g, [VC.karoo1]);
    expect(g.power(at(g, 'p1', 'characters', VC.karoo1))).toBe(4000);
  });

  it('only Characters with both types are offered: Sanji and the Leader are not', () => {
    const g = swing();
    expect(offeredIds(g)).toEqual([VC.karoo1, PINCERS].sort());
    expect(offeredIds(g)).not.toContain(VC.sanji1);
  });

  it('Pincers itself can be chosen (0 -> 1000)', () => {
    const g = swing();
    pickCards(g, [PINCERS]);
    expect(g.power(at(g, 'p1', 'characters', PINCERS))).toBe(1000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = swing();
    none(g);
    expect(g.power(at(g, 'p1', 'characters', VC.karoo1))).toBe(3000);
  });

  it('only one Character is boosted even with two eligible', () => {
    const g = swing([VC.karoo1, VC.karoo5]);
    pickCards(g, [VC.karoo5]);
    expect(g.power(at(g, 'p1', 'characters', VC.karoo5))).toBe(8000);
    expect(g.power(at(g, 'p1', 'characters', VC.karoo1))).toBe(3000);
  });

  it('the bonus lasts for the turn, past the battle', () => {
    const g = swing();
    pickCards(g, [VC.karoo1]);
    endBattle(g);
    expect(g.power(at(g, 'p1', 'characters', VC.karoo1))).toBe(4000);
  });

  it('a lone Pincers boosting itself makes the 1000 power attack count: it hits a 1000 power rested Character', () => {
    const g = mine(
      LC.vivi,
      { characters: [PINCERS] },
      { characters: [{ card: 'EB04-032', rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', PINCERS), at(g, 'p2', 'characters', 'EB04-032'));
    pickCards(g, [PINCERS]);
    endBattle(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });
});
