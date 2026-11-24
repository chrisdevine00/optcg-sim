/**
 * OP12-031 Tashigi (Character, Green, cost 5, 7000, no Counter, {Navy} {East Blue}).
 *
 * Card text: "[On Play] Rest up to 1 of your opponent's Characters with a base cost of 6 or less. Then,
 * give up to 3 rested DON!! cards to your [Roronoa Zoro] Leader."
 *
 * Rules: "base cost" ignores cost modifiers; "up to" may be fewer (M4b-4), asked as a count when more
 * than one DON!! can go; the DON!! come from the rested DON!! of the cost area (the DON!! rested to
 * pay this card's own cost count) and go to the Leader named Roronoa Zoro only; each given DON!! is
 * +1000 power on the owner's turn. A given DON!!'s own state (M6b-Q32) is not asserted. Whether the
 * second part runs when the first chose nothing is not asserted (no ruling on file).
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
  pickInst,
  playRaw,
  S12,
} from './kit-op12a.ts';

const TAS = 'OP12-031';

type P = string | { card: string; rested?: boolean };

function board(p2: P[], leader: string = LD12.zoro, hand: string[] = [], active = 5, rested = 0) {
  return mine(leader, { hand: [TAS, ...hand], costArea: { active, rested } }, { characters: p2 });
}

describe('OP12-031 Tashigi: [On Play] rest a Character (base cost 6 or less), then give up to 3 rested DON!! to the Zoro Leader', () => {
  it('printed values: cost 5, 7000, no Counter', () => {
    const g = board([]);
    const c = g.card(g.find('p1', 'hand', TAS));
    expect([c.cost, c.power, c.counter]).toEqual([5, 7000, null]);
  });

  it('offers exactly the opponent Characters with a base cost of 6 or less (6 yes, 7 no)', () => {
    const g = board([S12.thatch, S12.oars, S12.sai, S12.shiki]);
    playRaw(g, TAS);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.sai, S12.thatch].sort());
  });

  it('rests the chosen Character, then gives 3 rested DON!! to the Zoro Leader (8000 this turn)', () => {
    const g = board([S12.thatch]);
    playRaw(g, TAS);
    pickInst(g, [chr(g, 'p2', S12.thatch)]);
    giveDonFlow(g, 3, g.leader('p1'));
    expect(g.card(chr(g, 'p2', S12.thatch)).rested).toBe(true);
    // 5 DON!! were rested to pay the cost; 3 of them are now given
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 2, given: 3 });
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(kind(g)).toBe('main');
  });

  it('"up to 3": fewer can be given', () => {
    const g = board([S12.thatch]);
    playRaw(g, TAS);
    pickInst(g, [chr(g, 'p2', S12.thatch)]);
    giveDonFlow(g, 1, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ rested: 4, given: 1 });
  });

  it('active DON!! are never given: DON!! that stay active remain active', () => {
    const g = board([S12.thatch], LD12.zoro, [], 8, 0);
    playRaw(g, TAS);
    pickInst(g, [chr(g, 'p2', S12.thatch)]);
    giveDonFlow(g, 3, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 2, given: 3 });
  });

  it('a Leader that is not [Roronoa Zoro] gets no DON!! (the rest still happens)', () => {
    const g = board([S12.thatch], LD12.luffy);
    playRaw(g, TAS);
    pickInst(g, [chr(g, 'p2', S12.thatch)]);
    if (kind(g) === 'choose') expect(offeredCardIds(g)).toEqual([]);
    expect(g.card(chr(g, 'p2', S12.thatch)).rested).toBe(true);
    expect(donOf(g, 'p1').given).toBe(0);
  });

  it('the other [Roronoa Zoro] Leader (OP01-001) is a target too', () => {
    const g = board([S12.thatch], LD12.zoroRed);
    playRaw(g, TAS);
    pickInst(g, [chr(g, 'p2', S12.thatch)]);
    giveDonFlow(g, 2, g.leader('p1'));
    expect(donOf(g, 'p1').given).toBe(2);
  });

  it('"base cost": a Navy Character with printed cost 5 and +2 cost (now 7) is still offered', () => {
    const g = board([S12.doll, S12.tashigiG, S12.oars]);
    expect(g.card(chr(g, 'p2', S12.tashigiG)).cost).toBe(7);
    playRaw(g, TAS);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.doll, S12.tashigiG].sort());
  });

  it('"base cost": a cost-7 Character lowered to 6 is still not offered', () => {
    const g = mine(
      LD12.zoro,
      { hand: [TAS, S12.cutAll], costArea: { active: 8, rested: 0 } },
      { characters: [S12.oars, S12.thatch] },
    );
    cutAll(g);
    expect(g.card(chr(g, 'p2', S12.oars)).cost).toBe(6);
    playRaw(g, TAS);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.thatch]);
  });

  it('"up to 1": choosing nobody rests nobody', () => {
    const g = board([S12.thatch]);
    playRaw(g, TAS);
    none(g);
    expect(g.card(chr(g, 'p2', S12.thatch)).rested).toBe(false);
  });

  it('only one Character is rested when two qualify', () => {
    const g = board([S12.thatch, S12.sai]);
    playRaw(g, TAS);
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    expect(g.card(chr(g, 'p2', S12.sai)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S12.thatch)).rested).toBe(false);
  });
});
