/**
 * OP12-063 Vinsmoke Reiju (Character, Purple, cost 4, 5000, Counter +1000, {The Vinsmoke Family}/
 * {GERMA 66}).
 *
 * Card text: "If you have 4 or more Events in your trash, this Character gains +2000 power and +5 cost.
 * [Blocker]"
 *
 * Rules: a permanent effect, read live (CR 8-1-3-3): only Event cards in MY trash count; +5 cost
 * changes the current cost, not the base cost (CR 4-9); the bonus is flat (not per Event).
 * [Blocker] is printed and always active.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  cast,
  costOf,
  kw,
  LB,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  passCounter,
  payHand,
  SB,
  theirs,
} from './kit-op12b.ts';

const REIJU = 'OP12-063';
const EV = SB.event;
const CONCASSER = 'OP12-059';
const HINA = 'OP12-051';

const stat = (trashed: string[], theirTrash: string[] = []) => {
  const g = mine(LB.croc, { characters: [REIJU], trash: trashed }, { trash: theirTrash });
  const r = g.find('p1', 'characters', REIJU);
  return { g, r, power: g.power(r), cost: costOf(g, r) };
};

describe('OP12-063 Vinsmoke Reiju: 4+ Events in trash: +2000 power and +5 cost; [Blocker]', () => {
  it('with 4 Events in my trash: 7000 power and cost 9', () => {
    const s = stat([EV, EV, EV, EV]);
    expect(s.power).toBe(7000);
    expect(s.cost).toBe(9);
  });

  it('boundary: 3 Events: printed 5000 power and cost 4', () => {
    const s = stat([EV, EV, EV]);
    expect(s.power).toBe(5000);
    expect(s.cost).toBe(4);
  });

  it('the bonus is flat: 7 Events still give +2000 and +5 only', () => {
    const s = stat([EV, EV, EV, EV, EV, EV, EV]);
    expect(s.power).toBe(7000);
    expect(s.cost).toBe(9);
  });

  it('only Event cards count: 3 Events and 3 Characters do not make 4 Events', () => {
    const s = stat([EV, EV, EV, SB.sai, SB.sai, SB.sai]);
    expect(s.power).toBe(5000);
    expect(s.cost).toBe(4);
  });

  it("must not: Events in the opponent's trash do not count", () => {
    const s = stat([EV], [EV, EV, EV, EV, EV]);
    expect(s.power).toBe(5000);
    expect(s.cost).toBe(4);
  });

  it('has [Blocker] with and without the bonus', () => {
    const a = stat([]);
    expect(kw(a.g, a.r)).toContain('Blocker');
    const b = stat([EV, EV, EV, EV]);
    expect(kw(b.g, b.r)).toContain('Blocker');
  });

  it('the bonus appears as soon as the fourth Event reaches the trash (playing Concasser)', () => {
    const g = mine(LB.croc, { characters: [REIJU], hand: [CONCASSER], trash: [EV, EV, EV] });
    const r = g.find('p1', 'characters', REIJU);
    expect(g.power(r)).toBe(5000);
    cast(g, CONCASSER);
    expect(g.power(r)).toBe(7000);
    expect(costOf(g, r)).toBe(9);
  });

  it('the +5 cost is the current cost only: a base-cost-4 filter still finds it (Hina)', () => {
    const g = mine(
      LB.croc,
      { hand: [SB.sai], characters: [HINA] },
      { characters: [REIJU], trash: [EV, EV, EV, EV] },
    );
    const hina = g.find('p1', 'characters', HINA);
    act(g, { type: 'activate', card: hina, ability: offeredAbilities(g, hina)[0]! });
    payHand(g, [SB.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([REIJU]);
  });

  it('as a Blocker it blocks with 7000 power when the bonus is on', () => {
    const g = theirs(
      LB.croc,
      { characters: [REIJU], trash: [EV, EV, EV, EV] },
      { characters: [SB.hajrudin] },
    );
    attack(g, g.find('p2', 'characters', SB.hajrudin), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([g.find('p1', 'characters', REIJU)]);
    act(g, { type: 'block', blocker: g.find('p1', 'characters', REIJU) });
    passCounter(g);
    // 6000 attacker against 7000: Reiju survives.
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});
