/**
 * OP12-070 Sanji (Character, Purple, cost 3, 5000, no Counter, {Alabasta}/{Straw Hat Crew}).
 *
 * Card text: "This Character gains +1000 power for every 5 Events in your trash. If this Character would
 * be removed from the field by your opponent's effect, you may return 1 DON!! card from your field
 * to your DON!! deck instead."
 *
 * Rules: the power bonus is read live, in steps of 5 Events (floor division) in MY trash. The
 * replacement (CR 8-1-3-4) is optional, covers the opponent's EFFECTS only (K.O., return to hand,
 * bottom of deck), not battle, and needs a DON!! card on my field (in the cost area or given) to
 * return (CR 8-1-3-4-5). It is not once per turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  cast,
  chars,
  don,
  donChoices,
  kind,
  LB,
  mine,
  need,
  noDefence,
  opponentKOs,
  pickInst,
  SB,
  theirs,
  trash,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SANJI = 'OP12-070';
const EV = SB.event;
const LIGHTNING = 'OP09-077';
const CULVERIN = 'OP11-061';

const powerWith = (events: number, theirEvents = 0) => {
  const g = mine(
    LB.croc,
    { characters: [SANJI], trash: Array(events).fill(EV) },
    { trash: Array(theirEvents).fill(EV) },
  );
  return g.power(g.find('p1', 'characters', SANJI));
};

/** After accepting a replacement that returns DON!!, pick the first offered class if asked. */
function accept(g: TestGame): void {
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: true });
  if (kind(g) === 'choose' && donChoices(g).length) {
    act(g, { type: 'pick', choice: donChoices(g)[0]! });
  }
}

function koed(opts: { active?: number; rested?: number } = {}): TestGame {
  const g = theirs(
    LB.croc,
    { characters: [SANJI], costArea: { active: opts.active ?? 2, rested: opts.rested ?? 0 } },
    { hand: [LIGHTNING] },
  );
  opponentKOs(g, g.find('p1', 'characters', SANJI));
  return g;
}

describe('OP12-070 Sanji: +1000 per 5 Events in trash; may return 1 DON!! instead of removal by their effect', () => {
  it('power: 0 to 4 Events give 5000, 5 give 6000', () => {
    expect(powerWith(0)).toBe(5000);
    expect(powerWith(4)).toBe(5000);
    expect(powerWith(5)).toBe(6000);
  });

  it('power: steps of 5: 9 Events still 6000, 10 give 7000', () => {
    expect(powerWith(9)).toBe(6000);
    expect(powerWith(10)).toBe(7000);
  });

  it("must not: Events in the opponent's trash do not count", () => {
    expect(powerWith(0, 10)).toBe(5000);
    expect(powerWith(3, 10)).toBe(5000);
  });

  it('only Event cards count: 5 Characters in the trash give no bonus', () => {
    const g = mine(LB.croc, { characters: [SANJI], trash: Array(5).fill(SB.sai) });
    expect(g.power(g.find('p1', 'characters', SANJI))).toBe(5000);
  });

  it('K.O. by an opponent effect: accept returns 1 DON!! to the DON!! deck and Sanji stays', () => {
    const g = koed();
    accept(g);
    expect(chars(g)).toEqual([SANJI]);
    expect(trash(g)).toEqual([]);
    expect(don(g)).toMatchObject({ deck: 9, active: 1 });
  });

  it('declining: Sanji is K.O.d and no DON!! moves', () => {
    const g = koed();
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([SANJI]);
    expect(don(g)).toMatchObject({ deck: 8, active: 2 });
  });

  it('also covers a non-K.O. removal: bottom of the deck (Gum-Gum Jet Culverin)', () => {
    const g = theirs(
      LB.croc,
      { characters: [SANJI], costArea: { active: 2, rested: 0 } },
      { hand: [CULVERIN] },
    );
    cast(g, CULVERIN);
    pickInst(g, [g.find('p1', 'characters', SANJI)]);
    accept(g);
    expect(chars(g)).toEqual([SANJI]);
    expect(don(g).deck).toBe(9);
  });

  it('unpayable: with no DON!! card on my field the replacement is not available', () => {
    const g = koed({ active: 0, rested: 0 });
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([SANJI]);
  });

  it('a rested DON!! on the field can be the one returned (the field, not only active DON!!)', () => {
    const g = koed({ active: 0, rested: 1 });
    accept(g);
    expect(chars(g)).toEqual([SANJI]);
    expect(don(g)).toMatchObject({ deck: 10, rested: 0 });
  });

  it('a DON!! given to a card is on my field too: it can be the one returned (no cost-area DON!! at all)', () => {
    const g = theirs(
      LB.croc,
      { characters: [{ card: SANJI, don: 1 }], costArea: { active: 0, rested: 0 } },
      { hand: [LIGHTNING] },
    );
    opponentKOs(g, g.find('p1', 'characters', SANJI));
    accept(g);
    expect(chars(g)).toEqual([SANJI]);
    expect(don(g)).toMatchObject({ deck: 10, given: 0 });
  });

  it('must not: a battle K.O. is not an effect: Sanji is K.O.d with no offer', () => {
    const g = theirs(
      LB.croc,
      { characters: [{ card: SANJI, rested: true }], costArea: { active: 2, rested: 0 } },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.find('p1', 'characters', SANJI));
    noDefence(g);
    expect(chars(g)).toEqual([]);
    expect(don(g)).toMatchObject({ deck: 8, active: 2 });
  });
});
