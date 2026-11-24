/**
 * OP17-072 Black Maria (Character, Purple, cost 2, 1000, Counter +1000, {Animal Kingdom Pirates}, [Blocker]).
 *
 * Card text: "[Blocker] [On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your hand:
 * Up to 1 of your Leader or Characters gains +1000 power during this battle."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-2-16, CR 8-3-1-3, CR 10-2-13, CR 8-4-4-1, RL-08. The shared
 * checks live in kit-op17b.ts `describeHandBoostBlocker`.
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

const MARIA = 'OP17-072';

describeHandBoostBlocker({ id: MARIA, boost: 1000 });

describe('OP17-072 Black Maria: further checks', () => {
  it('Black Maria can boost herself: 1000 -> 2000 for the battle', () => {
    const g = theirTurn(
      side(LD.akp, BLUE, { characters: [MARIA], hand: [SCN.c2] }),
      side(LD.luffy, RED, { characters: [SCN.c3] }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    yes(g);
    payHand(g, [SCN.c2]);
    need(g, 'choose');
    expect(offeredIds(g)).toContain(MARIA);
    pickCards(g, [MARIA]);
    expect(g.power(at(g, 'p1', 'characters', MARIA))).toBe(2000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
