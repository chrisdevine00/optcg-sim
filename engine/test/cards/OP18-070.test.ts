/** OP18-070 Tom. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  game,
  hand,
  none,
  payDon,
  pick,
  PLAIN_BLUE,
  play,
  trash,
} from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { PLAIN_PURPLE, SHC3, STAGE2, STAGE5, STAGE6 } from './helpers-op18.ts';

const ID = 'OP18-070';
const onPlay = (handCards: string[], trashCards: string[], active = 2) => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      hand: [ID, ...handCards],
      trash: trashCards,
      costArea: { active, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );
  play(g, ID);
  return g;
};

describe('OP18-070 Tom', () => {
  it('[On Play] DON!! −1 and trash 1: add up to 2 Stage cards from your trash to your hand', () => {
    const g = onPlay([SHC3], [STAGE5, SHC3, STAGE6, STAGE2]);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', SHC3)]);
    expect(candidates(g).length).toBe(3);
    pick(g, [g.find('p1', 'trash', STAGE5), g.find('p1', 'trash', STAGE6)]);
    expect(hand(g, 'p1').sort()).toEqual([STAGE5, STAGE6].sort());
    expect(trash(g, 'p1').sort()).toEqual([SHC3, SHC3, STAGE2].sort());
    expect(don(g, 'p1').deck).toBe(9);
  });

  it('may be declined: nothing is paid', () => {
    const g = onPlay([SHC3], [STAGE5]);
    decline(g);
    expect(hand(g, 'p1')).toEqual([SHC3]);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('"up to 2": may take none after paying', () => {
    const g = onPlay([SHC3], [STAGE5]);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', SHC3)]);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([SHC3, STAGE5].sort());
  });

  it('not offered without a card to trash', () => {
    const g = onPlay([], [STAGE5]);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });
});
