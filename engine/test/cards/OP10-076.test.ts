/** OP10-076 Baby 5. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  canAccept,
  decline,
  dec,
  don,
  expectDecision,
  hand,
  option,
  pick,
  play,
  trash,
} from './helpers-a10g3.ts';
import { DON_LEADER, mk, OTHER_LEADER, V } from './helpers-a10g3.ts';

const ID = 'OP10-076';
// Baby 5 costs 3: with 5 active DON!! two stay active after the play, five are in the DON!! deck.
const start = (leader: string, hand: string[] = [ID, V.c1, V.c2]) => mk({ hand }, {}, leader, 5);

describe('OP10-076 Baby 5', () => {
  it('[On Play] trash 1 card from your hand: with a Donquixote Pirates Leader, add 1 DON!! as active', () => {
    const g = start(DON_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    addMost(g);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 3, deck: 4 });
  });

  it('"up to 1": the count may be 0, the card is still trashed', () => {
    const g = start(DON_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options!.at(-1)!.id);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 5 });
  });

  it('must not add DON!! without a Donquixote Pirates Leader: the cost is still paid', () => {
    const g = start(OTHER_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 5 });
  });

  it('the cost is optional: declining trashes nothing and adds nothing', () => {
    const g = start(DON_LEADER);
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 5 });
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = start(DON_LEADER, [ID]);
    play(g, ID);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expect(don(g, 'p1')).toMatchObject({ active: 2, deck: 5 });
  });
});
