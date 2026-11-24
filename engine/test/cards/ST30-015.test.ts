/** ST30-015 The Name of This Era Is "Whitebeard"!!. */
import { describe, expect, it } from 'vitest';
import { endCounter, game, none, pick, trash, V } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { damageWithP2 } from './helpers-rgl-penel.ts';
import {
  ACE6,
  ATMOS,
  donArea,
  ids,
  offeredPicks,
  P5000,
  P7000,
  SHC_LEADER,
} from './helpers-stg1.ts';

const ID = 'ST30-015';

const counter = (chars: Parameters<typeof game>[0]['characters']) =>
  counterStep({ leader: SHC_LEADER, hand: [ID], characters: chars, ...donArea(1) });

describe('ST30-015 The Name of This Era Is "Whitebeard"!!', () => {
  it('[Counter]: with 2 or more Characters with 6000 base power, up to 1 of your Leader or Character cards gains +4000 power during this battle', () => {
    const g = counter([ATMOS, ACE6]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 vs the 9000 attacker: the Leader holds
  });

  it('may give the +4000 to a Character instead of the Leader', () => {
    const g = counter([ATMOS, ACE6]);
    useCounter(g, ID);
    expect(offeredPicks(g)).toContain(g.find('p1', 'characters', ATMOS));
    pick(g, [g.find('p1', 'characters', ATMOS)]);
    expect(g.power(g.find('p1', 'characters', ATMOS))).toBe(10000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with only 1 Character with 6000 base power the Counter is played and does nothing', () => {
    const g = counter([ATMOS, P5000, P7000]);
    useCounter(g, ID);
    expect(offeredPicks(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('counts base power: a 5000 Character with 1 DON!! (current 6000) is not a second one', () => {
    const g = counterStep({
      leader: SHC_LEADER,
      hand: [ID],
      characters: [ATMOS, { card: P5000, don: 1 }],
      ...donArea(1),
    });
    useCounter(g, ID);
    expect(offeredPicks(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("[Trigger]: K.O. up to 1 of your opponent's Characters with 6000 power or less", () => {
    const g = damageWithP2(ID, {}, [V.c7, P6(), P7000, P5000], SHC_LEADER);
    g.act({ type: 'trigger', activate: true });
    // 6000 and 5000 qualify, 7000 and the 9000 attacker do not.
    expect(offeredPicks(g)).toEqual(
      expect.arrayContaining([g.find('p2', 'characters', P6()), g.find('p2', 'characters', P5000)]),
    );
    expect(offeredPicks(g)).not.toContain(g.find('p2', 'characters', P7000));
    expect(offeredPicks(g)).not.toContain(g.find('p2', 'characters', V.c7));
    pick(g, [g.find('p2', 'characters', P6())]);
    expect(ids(g, 'p2', 'characters').sort()).toEqual([P5000, P7000, V.c7].sort());
    expect(ids(g, 'p1', 'hand')).toEqual([]);
  });

  it('[Trigger]: "up to 1" may K.O. none', () => {
    const g = damageWithP2(ID, {}, [V.c7, P5000], SHC_LEADER);
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(ids(g, 'p2', 'characters')).toHaveLength(2);
  });
});

/** A 6000 vanilla (cost 4) for the Trigger's K.O. boundary. */
function P6(): string {
  return V.c4;
}
