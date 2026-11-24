/** ST30-004 Emporio.Ivankov. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  trash,
} from './helpers.ts';
import {
  ACE6,
  ATMOS,
  donArea,
  EVENT,
  offeredPicks,
  P5000,
  P7000,
  SLASH_LEADER,
} from './helpers-stg1.ts';

const ID = 'ST30-004';

const start = (h: string[]) =>
  game(
    { leader: SLASH_LEADER, hand: [ID, ...h], deck: [BLUE, BLUE, BLUE, BLUE, BLUE], ...donArea(1) },
    { leader: PLAIN_BLUE },
  );

/** Pay the reveal cost with these two cards. */
const reveal = (g: ReturnType<typeof start>, a: string, b: string) => {
  play(g, ID);
  accept(g);
  pick(g, [g.find('p1', 'hand', a), g.find('p1', 'hand', b)]);
};

describe('ST30-004 Emporio.Ivankov', () => {
  it('[On Play]: you may reveal 2 Character cards with 6000 power from your hand: draw 3 cards and trash 2 cards from your hand', () => {
    const g = start([ATMOS, ACE6, P5000]);
    reveal(g, ATMOS, ACE6);
    expect(g.eventsOfType('CardRevealed').map((e) => e.card)).toEqual(
      expect.arrayContaining([ATMOS, ACE6]),
    );
    expect(hand(g, 'p1')).toHaveLength(2 + 1 + 3); // ATMOS, ACE6, P5000 then +3
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', P5000), g.find('p1', 'hand', BLUE)]);
    expect(trash(g, 'p1').sort()).toEqual([BLUE, P5000].sort());
    expect(hand(g, 'p1')).toHaveLength(4);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('the revealed cards stay in hand and may be among the 2 trashed', () => {
    const g = start([ATMOS, ACE6]);
    reveal(g, ATMOS, ACE6);
    pick(g, [g.find('p1', 'hand', ATMOS), g.find('p1', 'hand', ACE6)]);
    expect(trash(g, 'p1').sort()).toEqual([ACE6, ATMOS].sort());
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE, BLUE]);
  });

  it('declining the cost reveals nothing and draws nothing', () => {
    const g = start([ATMOS, ACE6]);
    play(g, ID);
    decline(g);
    expect(g.eventsOfType('CardRevealed').filter((e) => e.card !== ID)).toHaveLength(0);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
    expect(don(g, 'p1').active).toBe(0);
  });

  it('with only 1 Character of 6000 power the cost cannot be paid (5000, 7000 and an Event do not count)', () => {
    const g = start([ATMOS, P5000, P7000, EVENT]);
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('only exactly-6000 Characters are candidates for the reveal', () => {
    const g = start([ATMOS, ACE6, P5000, P7000]);
    play(g, ID);
    accept(g);
    expect(() => pick(g, [g.find('p1', 'hand', P5000)])).toThrow();
    expect(() => pick(g, [g.find('p1', 'hand', P7000)])).toThrow();
    expect(offeredPicks(g)).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', ATMOS), g.find('p1', 'hand', ACE6)]);
    expect(
      g.eventsOfType('CardRevealed').filter((e) => e.card === ATMOS || e.card === ACE6),
    ).toHaveLength(2);
  });
});
