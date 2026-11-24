/** ST30-017 And You Get Yourself in Big Trouble!!. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, don, game, hand, none, pick, play, PLAIN_BLUE, trash, V } from './helpers.ts';
import { damageWithP2 } from './helpers-rgl-penel.ts';
import {
  ACE6,
  ATMOS,
  donArea,
  offeredPicks,
  orderAll,
  P5000,
  P7000,
  SLASH_LEADER,
} from './helpers-stg1.ts';

const ID = 'ST30-017';

const start = (top: string[]) =>
  game(
    { leader: SLASH_LEADER, hand: [ID], deck: [...top, BLUE, BLUE, BLUE], ...donArea(1) },
    { leader: PLAIN_BLUE },
  );

describe('ST30-017 And You Get Yourself in Big Trouble!!', () => {
  it('[Main]: looks at 5, reveals up to 1 Character with 6000 power into your hand, the rest go to the bottom', () => {
    const g = start([P5000, ATMOS, V.c1, V.c2, P7000]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', ATMOS)]);
    // "in any order" (STB5-R3): 4 cards go to the bottom, so the owner is asked the order
    expect(dec(g)?.kind).toBe('order');
    expect(dec(g)?.player).toBe('p1');
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([ATMOS]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(don(g, 'p1').rested).toBe(1);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(7);
    expect(deck.slice(3).sort()).toEqual([P5000, V.c1, V.c2, P7000].sort());
  });

  it('only exactly 6000 power Characters are candidates (5000 and 7000 are not), and "up to 1" may take none', () => {
    const g = start([P5000, P7000, ACE6, V.c1, V.c2]);
    play(g, ID);
    expect(offeredPicks(g)).toEqual([g.find('p1', 'deck', ACE6)]);
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the 6th card is not looked at', () => {
    const g = start([V.c1, V.c2, V.c3, P7000, V.c1, ATMOS]);
    play(g, ID);
    if (dec(g)?.kind === 'choose') none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(ATMOS);
  });

  it('[Trigger]: activates the [Main] effect when taken from Life', () => {
    const g = damageWithP2(
      ID,
      { deck: [P5000, ATMOS, V.c1, V.c2, P7000, BLUE, BLUE, BLUE] },
      [V.c7],
      SLASH_LEADER,
    );
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'deck', ATMOS)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([ATMOS]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
  });

  it('[Trigger]: declining adds the card to your hand and looks at nothing', () => {
    const g = damageWithP2(
      ID,
      { deck: [ATMOS, V.c1, V.c2, V.c3, P7000, BLUE] },
      [V.c7],
      SLASH_LEADER,
    );
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(ATMOS);
  });
});
