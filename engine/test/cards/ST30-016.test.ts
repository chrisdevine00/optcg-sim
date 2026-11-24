/** ST30-016 Can You Still Fight, Luffy?! Of Course!!. */
import { describe, expect, it } from 'vitest';
import { BLUE, endCounter, hand, none, pick, trash } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { ACE6, ATMOS, donArea, LUFFY5, LUFFY6, SHC_LEADER } from './helpers-stg1.ts';

const ID = 'ST30-016';

const counter = (chars: string[]) =>
  counterStep({
    leader: SHC_LEADER,
    hand: [ID],
    characters: chars,
    deck: [BLUE, BLUE, BLUE],
    ...donArea(1),
  });

describe('ST30-016 Can You Still Fight, Luffy?! Of Course!!', () => {
  it('[Counter]: up to 1 of your Leader or Character cards gains +3000 power during this battle', () => {
    const g = counter([]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 8000 vs the 9000 attacker is not enough
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('Then, if you have [Portgas.D.Ace] and [Monkey.D.Luffy] Characters with 6000 base power, draw 1 card', () => {
    const g = counter([ACE6, LUFFY6]);
    useCounter(g, ID);
    pick(g, [g.find('p1', 'characters', ACE6)]);
    expect(g.power(g.find('p1', 'characters', ACE6))).toBe(9000);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('with only one of the two names there is no draw, but the +3000 is still given', () => {
    const a = counter([ACE6, ATMOS]);
    useCounter(a, ID);
    pick(a, [a.leader('p1')]);
    expect(a.power(a.leader('p1'))).toBe(8000);
    expect(hand(a, 'p1')).toEqual([]);
    const b = counter([LUFFY6, ATMOS]);
    useCounter(b, ID);
    pick(b, [b.leader('p1')]);
    expect(hand(b, 'p1')).toEqual([]);
  });

  it('the Luffy must have 6000 base power: a 5000 [Monkey.D.Luffy] does not count', () => {
    const g = counter([ACE6, LUFFY5]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"Then" is its own step: choosing no target for "up to 1" still draws', () => {
    const g = counter([ACE6, LUFFY6]);
    useCounter(g, ID);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});
