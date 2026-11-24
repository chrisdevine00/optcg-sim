/** ST34-001 Charlotte Katakuri. */
import { describe, expect, it } from 'vitest';
import {
  addMost,
  dec,
  don,
  expectDecision,
  game,
  hand,
  option,
  pick,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import {
  ATMOS,
  BMP_LEADER,
  donArea,
  EVENT,
  ids,
  koInBattle,
  NONSLASH_LEADER,
  offeredPicks,
  P7000,
  plantReturnDon,
  trash,
} from './helpers-stg1.ts';

const ID = 'ST34-001';

/** p1's Leader returns 1 DON!! to the DON!! deck with a planted [Activate: Main]. */
const returning = (leader: string, extra: { donDeck?: number } = {}) => {
  const g = game({ leader, characters: [ID], ...donArea(3), ...extra }, { leader: PLAIN_BLUE });
  plantReturnDon(g, leader);
  return g;
};
const returnOne = (g: ReturnType<typeof returning>) => {
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'planted' });
  // Choose the DON!! to return, if asked.
  while (
    dec(g)?.kind === 'choose' &&
    g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice)
  ) {
    g.act(g.legal().find((a) => a.type === 'pick')!);
  }
};

describe('ST34-001 Charlotte Katakuri', () => {
  it('[Your Turn] [Once Per Turn] when a DON!! card is returned to your DON!! deck, if your Leader has {Big Mom Pirates}: add up to 2 DON!! and rest them', () => {
    const g = returning(BMP_LEADER);
    const before = don(g, 'p1');
    returnOne(g);
    expectDecision(g, 'choose', 'p1');
    addMost(g);
    const after = don(g, 'p1');
    // 1 returned, 2 added rested.
    expect(after.rested).toBe(before.rested + 2);
    expect(after.deck).toBe(before.deck + 1 - 2);
  });

  it('"up to 2": 1 or none may be added instead', () => {
    const counts = (pickIndex: number) => {
      const g = returning(BMP_LEADER);
      const before = don(g, 'p1');
      returnOne(g);
      const d = expectDecision(g, 'choose', 'p1');
      expect(d.options!.map((o) => o.label)).toEqual(['2 DON!!', '1 DON!!', 'None']);
      option(g, d.options![pickIndex]!.id);
      return don(g, 'p1').rested - before.rested;
    };
    expect(counts(1)).toBe(1);
    expect(counts(2)).toBe(0);
  });

  it('[Once Per Turn]: a second return in the same turn adds nothing', () => {
    const g = returning(BMP_LEADER);
    returnOne(g);
    addMost(g);
    const mid = don(g, 'p1');
    returnOne(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1').rested).toBe(mid.rested);
    expect(don(g, 'p1').deck).toBe(mid.deck + 1);
  });

  it('without a {Big Mom Pirates} Leader nothing is added', () => {
    const g = returning(NONSLASH_LEADER);
    const before = don(g, 'p1');
    returnOne(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1').deck).toBe(before.deck + 1);
    expect(don(g, 'p1').rested).toBe(before.rested);
  });

  it('adds only what the DON!! deck holds: with the returned DON!! alone in it, 1 of "up to 2"', () => {
    const g = game(
      { leader: BMP_LEADER, characters: [ID], ...donArea(10), donDeck: 0 },
      { leader: PLAIN_BLUE },
    );
    plantReturnDon(g, BMP_LEADER);
    returnOne(g);
    if (dec(g)?.kind === 'choose') addMost(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 0, rested: 1 });
  });

  describe('[On K.O.]', () => {
    const koed = (h: string[]) =>
      koInBattle(
        { leader: NONSLASH_LEADER, hand: h, characters: [{ card: ID, rested: true }] },
        ID,
      );

    it('play up to 1 Character card with 8000 power or less from your hand (no Leader needed)', () => {
      const g = koed([V.c6, P7000]);
      expect(offeredPicks(g)).toContain(g.find('p1', 'hand', V.c6));
      pick(g, [g.find('p1', 'hand', V.c6)]);
      expect(ids(g, 'p1', 'characters')).toEqual([V.c6]);
      expect(hand(g, 'p1')).toEqual([P7000]);
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('a 9000 Character and an Event are not candidates (exact boundary at 8000)', () => {
      const g = koed([V.c7, EVENT, ATMOS]);
      expect(offeredPicks(g)).toEqual([g.find('p1', 'hand', ATMOS)]);
      g.act({ type: 'done' });
      expect(ids(g, 'p1', 'characters')).toEqual([]);
      expect(hand(g, 'p1')).toHaveLength(3);
    });
  });
});
