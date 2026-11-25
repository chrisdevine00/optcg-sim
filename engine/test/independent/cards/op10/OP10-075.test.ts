/**
 * OP10-075 Foxy (Character, Purple, cost 2, 1000, Counter +2000, {Foxy Pirates}).
 *
 * Card text: "[Activate: Main] You may trash this Character: If the number of DON!! cards on your
 * field is equal to or less than the number on your opponent's field, draw 1 card."
 *
 * Rules: the trash is a cost (CR 8-3-1-4), paid even when the "If" then fails; "DON!! cards on
 * your field" are the cost area (active and rested) plus DON!! given to cards, never the DON!! deck.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  LD10,
  mine,
  need,
  offeredAbility,
  onField,
  rawActivate,
  SC10,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-075';

function game(
  p1: { active?: number; rested?: number; given?: number },
  p2: { active?: number; rested?: number; given?: number },
  extra: { hand?: string[] } = {},
) {
  const g = mine(
    LD10.plain,
    {
      characters: [ID, ...(p1.given ? [{ card: SC10.dr2, don: p1.given }] : [])],
      costArea: { active: p1.active ?? 0, rested: p1.rested ?? 0 },
      deck: [SC10.dr3, BLUE, BLUE, BLUE],
      hand: extra.hand ?? [],
    },
    {
      characters: p2.given ? [{ card: SC10.dr2b, don: p2.given }] : [],
      costArea: { active: p2.active ?? 0, rested: p2.rested ?? 0 },
    },
  );
  return g;
}

function use(g: ReturnType<typeof game>) {
  rawActivate(g, g.find('p1', 'characters', ID));
}

describe('OP10-075 Foxy [Activate: Main] trash this: draw if DON!! <= opponent', () => {
  it('equal DON!! counts (3 vs 3): trashes Foxy and draws 1', () => {
    const g = game({ active: 3 }, { active: 3 });
    use(g);
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SC10.dr3]);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('fewer DON!! than the opponent (2 vs 3): draws 1', () => {
    const g = game({ active: 2 }, { active: 3 });
    use(g);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SC10.dr3]);
  });

  it('boundary: one more DON!! than the opponent (4 vs 3): the cost is paid, no draw', () => {
    const g = game({ active: 4 }, { active: 3 });
    use(g);
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p1', 'hand')).toEqual([]);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('0 vs 0 counts as equal and draws', () => {
    const g = game({}, {});
    use(g);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SC10.dr3]);
  });

  it('rested DON!! count on both sides (2 active + 2 rested vs 4 active: draws; vs 3: does not)', () => {
    const a = game({ active: 2, rested: 2 }, { active: 4 });
    use(a);
    expect(zoneIds(a, 'p1', 'hand')).toEqual([SC10.dr3]);
    const b = game({ active: 2, rested: 2 }, { active: 1, rested: 2 });
    use(b);
    expect(zoneIds(b, 'p1', 'hand')).toEqual([]);
  });

  it('DON!! given to a Character counts as on the field (own: 2 + 1 given vs 2 is too many)', () => {
    const g = game({ active: 2, given: 1 }, { active: 2 });
    expect(onField(g, 'p1')).toBe(3);
    use(g);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([]);
  });

  it("the opponent's given DON!! counts too (2 vs 1 + 1 given draws)", () => {
    const g = game({ active: 2 }, { active: 1, given: 1 });
    expect(onField(g, 'p2')).toBe(2);
    use(g);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SC10.dr3]);
  });

  it('the DON!! deck is not "on the field": 0 on the field vs 5 on the field draws although the deck has more', () => {
    const g = game({}, { active: 5 });
    use(g);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SC10.dr3]);
  });

  it('draws exactly 1 card however large the gap, and nothing else moves', () => {
    const g = game({ active: 0 }, { active: 9 }, { hand: [BLUE] });
    use(g);
    expect(zoneIds(g, 'p1', 'hand')).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });

  it('is offered right after being played, and no other card is trashed as the cost', () => {
    const g = mine(LD10.plain, {
      hand: [ID],
      costArea: { active: 2, rested: 0 },
      characters: [SC10.dr2],
      deck: [SC10.dr3, BLUE],
    });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    while (g.legal().some((a) => a.type === 'pick'))
      g.act(g.legal().find((a) => a.type === 'pick')!);
    const foxy = g.find('p1', 'characters', ID);
    expect(offeredAbility(g, foxy)).toBe(true);
    rawActivate(g, foxy);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([ID]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SC10.dr2]);
  });
});
