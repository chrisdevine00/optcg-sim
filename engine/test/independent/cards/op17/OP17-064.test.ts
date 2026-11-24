/**
 * OP17-064 King (Character, Purple, cost 9, 10000, no Counter, {Lunarian}/{Animal Kingdom Pirates}, [Blocker]).
 *
 * Card text: "[Blocker] [On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your hand:
 * Up to 1 of your Leader or Characters gains +2000 power during this battle."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-2-16 (activates whatever is attacked), CR 8-3-1-3 (cost),
 * CR 10-2-13 ([Once Per Turn]; spent when it resolves), CR 8-4-4-1 ("up to"), RL-08 (this battle).
 * The shared checks live in kit-op17b.ts `describeHandBoostBlocker`.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  describeHandBoostBlocker,
  LD,
  need,
  offeredIds,
  payHand,
  pickCards,
  RED,
  SCN,
  side,
  theirTurn,
  yes,
} from './kit-op17b.ts';

const KING = 'OP17-064';

describeHandBoostBlocker({ id: KING, boost: 2000 });

describe('OP17-064 King: further checks', () => {
  it('King itself is a legal target of its own boost (+2000 on 10000)', () => {
    const g = theirTurn(
      side(LD.akp, BLUE, { characters: [KING], hand: [SCN.c2] }),
      side(LD.luffy, RED, { characters: [SCN.c3] }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    yes(g);
    payHand(g, [SCN.c2]);
    need(g, 'choose');
    expect(offeredIds(g)).toContain(KING);
    pickCards(g, [KING]);
    expect(g.power(at(g, 'p1', 'characters', KING))).toBe(12000);
  });
});
