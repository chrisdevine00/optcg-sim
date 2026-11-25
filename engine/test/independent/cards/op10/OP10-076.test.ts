/**
 * OP10-076 Baby 5 (Character, Purple, cost 3, 1000, Counter +2000, {Donquixote Pirates}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: If your Leader has the "Donquixote
 * Pirates" type, add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: CR 8-3-1-4 (a "may" cost is optional; no cost, no effect); the "If" after the colon is an
 * effect condition, so the cost is paid even when it fails; "add up to 1" asks a count.
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  asksCount,
  BLUE,
  donOf14,
  LD10,
  mine,
  need,
  no,
  onField,
  payHand,
  playRaw,
  SC10,
  unusable,
  yes,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-076';

/** p1 has Baby 5 plus `hand` (here two other cards) and 3 active DON!! (Baby 5 costs 3). */
function game(leader: string = LD10.dp, hand: string[] = [BLUE, SC10.dr2], donDeckFull = true) {
  return mine(leader, {
    hand: [ID, ...hand],
    costArea: donDeckFull ? { active: 3, rested: 0 } : { active: 3, rested: 7 },
    ...(donDeckFull ? {} : { donDeck: 0 }),
    deck: [BLUE, BLUE],
  });
}

describe('OP10-076 Baby 5 [On Play] trash 1: add 1 active DON!! (Donquixote Pirates Leader)', () => {
  it('paying the cost with a {Donquixote Pirates} Leader adds 1 DON!! from the DON!! deck, active', () => {
    const g = game();
    playRaw(g, ID);
    yes(g, 'p1');
    payHand(g, [SC10.dr2]);
    expect(asksCount(g)).toBe(true);
    addDon(g, 1);
    need(g, 'main', 'p1');
    const d = donOf14(g);
    expect(d.active).toBe(1);
    expect(d.rested).toBe(3);
    expect(d.deck).toBe(6);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([SC10.dr2]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([BLUE]);
  });

  it('the player chooses which hand card is trashed', () => {
    const g = game();
    playRaw(g, ID);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    addDon(g, 1);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([BLUE]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SC10.dr2]);
  });

  it('"up to 1": may add none; the trashed card stays trashed', () => {
    const g = game();
    playRaw(g, ID);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    expect(asksCount(g)).toBe(true);
    addDon(g, 0);
    need(g, 'main', 'p1');
    expect(onField(g)).toBe(3);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([BLUE]);
  });

  it('declining the cost: nothing is trashed and no DON!! is added', () => {
    const g = game();
    playRaw(g, ID);
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p1', 'trash')).toEqual([]);
    expect(zoneIds(g, 'p1', 'hand')).toHaveLength(2);
    expect(onField(g)).toBe(3);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('without a {Donquixote Pirates} Leader the cost is still paid but no DON!! is added (Then-style "If" after the colon)', () => {
    const g = game(LD10.plain);
    playRaw(g, ID);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p1', 'trash')).toEqual([BLUE]);
    expect(onField(g)).toBe(3);
    expect(donOf14(g).deck).toBe(7);
  });

  it("the Leader type is read, not the Character's own type: a {Donquixote Pirates} Character on the field does not help a plain Leader", () => {
    const g = mine(LD10.plain, {
      hand: [ID, BLUE],
      characters: [SC10.dr2],
      costArea: { active: 3, rested: 0 },
      deck: [BLUE],
    });
    playRaw(g, ID);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    need(g, 'main', 'p1');
    expect(onField(g)).toBe(3);
  });

  it('with an empty hand after playing, the cost cannot be paid: accept is not legal and nothing happens', () => {
    const g = game(LD10.dp, []);
    playRaw(g, ID);
    unusable(g, 'p1');
    need(g, 'main', 'p1');
    expect(onField(g)).toBe(3);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([]);
  });

  it('with an empty DON!! deck the cost is still paid and no DON!! appears', () => {
    const g = game(LD10.dp, [BLUE, SC10.dr2], false);
    expect(donOf14(g).deck).toBe(0);
    playRaw(g, ID);
    yes(g, 'p1');
    payHand(g, [BLUE]);
    if (asksCount(g)) addDon(g, 0);
    need(g, 'main', 'p1');
    expect(donOf14(g).deck).toBe(0);
    expect(onField(g)).toBe(10);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([BLUE]);
  });

  it('the effect is an [On Play]: a Baby 5 already on the field offers nothing', () => {
    const g = mine(LD10.dp, { characters: [ID], hand: [BLUE], costArea: { active: 3, rested: 0 } });
    need(g, 'main', 'p1');
    expect(g.legal().filter((a) => a.type === 'optional')).toEqual([]);
    expect(onField(g)).toBe(3);
  });
});
