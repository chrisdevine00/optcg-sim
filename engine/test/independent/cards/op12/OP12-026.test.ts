/**
 * OP12-026 Kuina (Character, Green, cost 4, 1000, Counter +1000, {East Blue} {Frost Moon Village}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Rest up to 1 of your opponent's Characters
 * with a base cost of 4 or less. Then, give up to 3 rested DON!! cards to your [Roronoa Zoro]
 * Leader."
 *
 * Rules: resting this Character is the cost, so it must be active; "base cost" ignores cost
 * modifiers such as -1 cost or +1 cost; "up to" may be fewer (M4b-4), asked as a count when more
 * than one DON!! can go; the DON!! come from the rested DON!! of the cost area and go to the Leader
 * named Roronoa Zoro only (any card of that name, not a Character); each given DON!! is +1000 power
 * on the owner's turn. A given DON!!'s own state (M6b-Q32) is not asserted. Whether the second part
 * still runs when the first part chose no Character is not asserted (no ruling on file).
 */
import { describe, expect, it } from 'vitest';
import {
  chr,
  cutAll,
  donOf,
  giveDonFlow,
  kind,
  LD12,
  mine,
  need,
  none,
  offeredCardIds,
  offeredOn,
  pickInst,
  S12,
  startActivate,
} from './kit-op12a.ts';

const KUI = 'OP12-026';

type P = string | { card: string; rested?: boolean };

function board(p2: P[], rested = 3, leader: string = LD12.zoro, hand: string[] = [], active = 2) {
  return mine(
    leader,
    { hand, characters: [KUI], costArea: { active, rested } },
    { characters: p2 },
  );
}

const kui = (g: ReturnType<typeof board>) => chr(g, 'p1', KUI);

describe('OP12-026 Kuina: rest this: rest an opponent Character (base cost 4 or less), then give up to 3 rested DON!! to the Zoro Leader', () => {
  it('printed values: cost 4, 1000, Counter +1000', () => {
    const g = board([]);
    const c = g.card(kui(g));
    expect([c.cost, c.power, c.counter]).toEqual([4, 1000, 1000]);
  });

  it('offers exactly the opponent Characters with a base cost of 4 or less (cost 4 yes, 5 no)', () => {
    const g = board([S12.sai, S12.hajrudin, S12.kingdew, S12.thatch]);
    startActivate(g, kui(g));
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.hajrudin, S12.sai].sort());
  });

  it('rests the chosen Character and Kuina, then gives 3 rested DON!! to the Zoro Leader (8000 this turn)', () => {
    const g = board([S12.sai]);
    startActivate(g, kui(g));
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    giveDonFlow(g, 3, g.leader('p1'));
    expect(g.card(chr(g, 'p2', S12.sai)).rested).toBe(true);
    expect(g.card(kui(g)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0, given: 3 });
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(kind(g)).toBe('main');
  });

  it('"up to 3": fewer can be given, the rest stay rested in the cost area', () => {
    const g = board([S12.sai]);
    startActivate(g, kui(g));
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    giveDonFlow(g, 1, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 2, given: 1 });
  });

  it('at most 3 are given even with 5 rested DON!!', () => {
    const g = board([S12.sai], 5, LD12.zoro, [], 0);
    startActivate(g, kui(g));
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    giveDonFlow(g, 3, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 3 });
  });

  it('active DON!! are never given: with no rested DON!! nothing is given', () => {
    const g = board([S12.sai], 0, LD12.zoro, [], 4);
    startActivate(g, kui(g));
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 0, given: 0 });
    expect(g.card(chr(g, 'p2', S12.sai)).rested).toBe(true);
  });

  it('a Leader that is not [Roronoa Zoro] gets no DON!! (the rest still happens)', () => {
    const g = board([S12.sai], 3, LD12.luffy);
    startActivate(g, kui(g));
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    if (kind(g) === 'choose') {
      // a count question may still appear, but no target can take the DON!!
      expect(offeredCardIds(g)).toEqual([]);
    }
    expect(g.card(chr(g, 'p2', S12.sai)).rested).toBe(true);
    expect(donOf(g, 'p1').given).toBe(0);
  });

  it('the other [Roronoa Zoro] Leader (OP01-001) is a target as well: name, not card, decides', () => {
    const g = board([S12.sai], 3, LD12.zoroRed);
    startActivate(g, kui(g));
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    giveDonFlow(g, 3, g.leader('p1'));
    expect(donOf(g, 'p1').given).toBe(3);
  });

  it('a [Roronoa Zoro] Character is not a target: only the Leader may receive the DON!!', () => {
    const g = mine(
      LD12.luffy,
      { characters: [KUI, S12.zoroChar], costArea: { active: 2, rested: 3 } },
      { characters: [S12.sai] },
    );
    startActivate(g, chr(g, 'p1', KUI));
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(g.power(chr(g, 'p1', S12.zoroChar))).toBe(6000);
  });

  it('"base cost": a cost-5 Character lowered to 4 by an effect is still not offered', () => {
    const g = mine(
      LD12.zoro,
      { hand: [S12.cutAll], characters: [KUI], costArea: { active: 5, rested: 3 } },
      { characters: [S12.kingdew, S12.sai] },
    );
    cutAll(g);
    expect(g.card(chr(g, 'p2', S12.kingdew)).cost).toBe(4);
    startActivate(g, kui(g));
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.sai]);
  });

  it('"base cost": Navy Characters raised by +2 cost (printed 3 and 4) are still offered, a printed 5 is not', () => {
    // [Doll] (opponent): during my turn all her {Navy} Characters gain +2 cost
    const g = board([S12.doll, S12.yamakaji, S12.koby, S12.tashigiG]);
    expect(g.card(chr(g, 'p2', S12.yamakaji)).cost).toBe(5);
    expect(g.card(chr(g, 'p2', S12.koby)).cost).toBe(6);
    startActivate(g, kui(g));
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.doll, S12.koby, S12.yamakaji].sort());
  });

  it('"up to 1": choosing nobody still rests Kuina (the cost)', () => {
    const g = board([S12.sai]);
    startActivate(g, kui(g));
    none(g);
    expect(g.card(chr(g, 'p2', S12.sai)).rested).toBe(false);
    expect(g.card(kui(g)).rested).toBe(true);
  });

  it('must not: not offered while Kuina is rested', () => {
    const g = mine(
      LD12.zoro,
      { characters: [{ card: KUI, rested: true }], costArea: { active: 2, rested: 3 } },
      { characters: [S12.sai] },
    );
    expect(offeredOn(g, chr(g, 'p1', KUI))).toEqual([]);
  });
});
