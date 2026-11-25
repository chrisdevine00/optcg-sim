/**
 * OP10-111 Monkey.D.Luffy (Character, Yellow, cost 1, 2000, Counter +1000, {Straw Hat Crew}/
 * {Supernovas}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 "Supernovas" type
 * card other than [Monkey.D.Luffy] and add it to your hand. Then, place the rest at the bottom of
 * your deck in any order."
 *
 * Rules: CR 8-4-4-2 (a look; the cards revealed are the player's choice among those matching);
 * "other than [Monkey.D.Luffy]" is a name test; "up to 1" allows 0; "any order" is the owner's.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  checkLook,
  deck,
  describeLookAdd,
  fill,
  hand,
  kind,
  LD10,
  mine,
  outcomes,
  playCard,
  SC10,
  SC14,
  tail,
} from './kit-op10c.ts';

const ID = 'OP10-111';
const LUFFY_NOVA = SC10.nova4r; // P-022 Monkey.D.Luffy: Red, {FILM}/{Straw Hat Crew}/{Supernovas}

describeLookAdd({
  id: ID,
  title: 'Luffy',
  n: 5,
  leader: LD10.plain,
  match: [SC10.nova5, SC10.nova6],
  miss: SC14.c1,
  beyond: SC10.nova3r,
});

function start(top: string[], rest: string[] = fill(BLUE, 8)) {
  const g = mine(LD10.plain, { hand: [ID], deck: [...top, ...rest] });
  playCard(g, ID);
  return g;
}

describe('OP10-111 Luffy: name and type filters, deck edges, order of the rest', () => {
  it('"other than [Monkey.D.Luffy]": a {Supernovas} card with that name is not offered', () => {
    const g = start([LUFFY_NOVA, SC10.nova5, SC14.c1, SC14.c2, SC14.c3]);
    checkLook(g, { candidates: [SC10.nova5], pick: [SC10.nova5] });
    expect(hand(g)).toEqual([SC10.nova5]);
  });

  it('another copy of OP10-111 itself in the top 5 is not offered either', () => {
    const g = start([ID, SC10.nova5, SC14.c1, SC14.c2, SC14.c3]);
    checkLook(g, { candidates: [SC10.nova5], pick: [] });
    expect(hand(g)).toEqual([]);
  });

  it('only the {Supernovas} type counts: a {Kid Pirates} card that is not {Supernovas} is not offered', () => {
    const g = start([SC10.kid2, SC14.c1, SC14.c2, SC14.c3, SC10.dr3]);
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
  });

  it('with a small deck (3 cards) the look covers what is there, and the rest return to the bottom', () => {
    const g = mine(LD10.plain, { hand: [ID], deck: [SC10.nova5, SC14.c1, SC14.c2] });
    playCard(g, ID);
    checkLook(g, { candidates: [SC10.nova5], pick: [SC10.nova5] });
    expect(hand(g)).toEqual([SC10.nova5]);
    expect(deck(g).sort()).toEqual([SC14.c1, SC14.c2].sort());
  });

  it('"in any order": both orders of the placed cards can be reached', () => {
    const g = start([SC10.nova5, SC14.c1, SC14.c2, SC14.c3, SC14.c4]);
    checkLookPickOnly(g);
    expect(kind(g)).toBe('order');
    const ends = outcomes(g, 'p1', (x) => deck(x).slice(-4).join('>'));
    expect(ends.size).toBe(24);
  });

  it('the rest never come back on top: the first card of the deck is the former 6th', () => {
    const g = start([SC10.nova5, SC14.c1, SC14.c2, SC14.c3, SC14.c4], [SC10.dr3, ...fill(BLUE, 7)]);
    checkLook(g, { candidates: [SC10.nova5], pick: [SC10.nova5] });
    expect(deck(g)[0]).toBe(SC10.dr3);
    expect(tail(deck(g), 4)).toEqual([SC14.c1, SC14.c2, SC14.c3, SC14.c4].sort());
  });
});

/** Pick Urouge from the look and stop at the order decision (not settled). */
function checkLookPickOnly(g: ReturnType<typeof start>) {
  const urouge = g
    .legal()
    .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
  expect(urouge).toHaveLength(1);
  g.act({ type: 'pick', choice: urouge[0]! });
  if (kind(g) === 'choose') g.act({ type: 'done' });
}
