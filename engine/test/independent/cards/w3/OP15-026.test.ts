/**
 * OP15-026 Jango (Character, Green, cost 1, 2000, Counter +1000, {East Blue}/{Black Cat Pirates}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 {East Blue} type
 * card and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 * [Activate: Main] You may trash this Character: Give up to 1 of your opponent's rested DON!! cards
 * to 1 of your opponent's Characters."
 *
 * M6b-Q24 (whose DON!! is given) is open: the opposing rested DON!! are the only candidates in
 * every position here, since my own DON!! are all active. Rules: {Type} is exact (CR 2-4-3);
 * "up to" allows 0 (CR 8-4-4-1); the activation cost is paid by trashing the card (CR 8-3-1); given
 * DON!! return at their owner's Refresh (CR 6-2-3).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  cardIds,
  choices,
  describeLookAdd,
  don,
  endUpTo,
  kind,
  mine,
  need,
  offeredNow,
  pickInst,
  toTheirMain,
  trash,
  useAbility,
  W3C,
  W3L,
} from './kit-w3.ts';

const JANGO = 'OP15-026';

describeLookAdd({
  id: JANGO,
  title: '[On Play] look at 3, reveal up to 1 {East Blue}',
  n: 3,
  leader: W3L.plain,
  // ST12-015 Patty & Carne and OP04-023 Kuro are {East Blue}; Thatch is not.
  match: ['ST12-015', 'OP04-023'],
  miss: W3C.thatch,
  beyond: 'ST12-015',
});

type P2 = Parameters<typeof mine>[2];
function start(p2: P2 = {}, copies = 1) {
  const g = mine(
    W3L.kid,
    { characters: Array.from({ length: copies }, () => JANGO) },
    { characters: [W3C.thatch], costArea: { active: 2, rested: 3 }, ...p2 },
  );
  const thatch = g.zone('p2', 'characters')[0]?.instance as string;
  return { g, jango: g.find('p1', 'characters', JANGO), thatch };
}

describe('OP15-026 Jango: [Activate: Main] trash this Character: give up to 1 rested DON!!', () => {
  it("trashes Jango as the cost and gives one of the opponent's rested DON!! to their Character", () => {
    const { g, jango, thatch } = start();
    useAbility(g, jango);
    need(g, 'choose', 'p1');
    pickInst(g, [thatch]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([JANGO]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(g.card(thatch).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2, given: 1 });
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0, given: 0 });
  });

  it("the target is one of the opponent's Characters: the Leader is not a candidate", () => {
    const { g, jango, thatch } = start();
    useAbility(g, jango);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([thatch]);
  });

  it('"up to 1": may give none, but Jango is already trashed (the cost was paid)', () => {
    const { g, jango } = start();
    useAbility(g, jango);
    endUpTo(g);
    expect(trash(g)).toEqual([JANGO]);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 3, given: 0 });
  });

  it('gives exactly one DON!! although three are rested', () => {
    const { g, jango, thatch } = start();
    useAbility(g, jango);
    pickInst(g, [thatch]);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
  });

  it('only a RESTED DON!! may be given: with none rested the cost is still paid and nothing is given', () => {
    const { g, jango, thatch } = start({ costArea: { active: 4, rested: 0 } });
    useAbility(g, jango);
    if (kind(g) === 'choose') {
      if (choices(g).includes(thatch)) pickInst(g, [thatch]);
      else endUpTo(g);
    }
    expect(trash(g)).toEqual([JANGO]);
    expect(don(g, 'p2')).toMatchObject({ active: 4, rested: 0, given: 0 });
    expect(g.card(thatch).don).toBe(0);
  });

  it('with no opposing Character the activation can still be paid: Jango is trashed, nothing is given', () => {
    const { g, jango } = start({ characters: [] });
    expect(offeredNow(g, jango)).toBe(true);
    useAbility(g, jango);
    if (kind(g) === 'choose') endUpTo(g);
    expect(trash(g)).toEqual([JANGO]);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 3, given: 0 });
  });

  it('it has no [Once Per Turn]: two Jangos can each be used in the same turn', () => {
    const { g, thatch } = start({}, 2);
    const first = g.find('p1', 'characters', JANGO, 0);
    useAbility(g, first);
    pickInst(g, [thatch]);
    const second = g.find('p1', 'characters', JANGO);
    expect(offeredNow(g, second)).toBe(true);
    useAbility(g, second);
    pickInst(g, [thatch]);
    expect(g.card(thatch).don).toBe(2);
    expect(trash(g)).toEqual([JANGO, JANGO]);
    expect(don(g, 'p2')).toMatchObject({ rested: 1, given: 2 });
  });

  it("the given DON!! add no power on my turn and return to their owner's cost area at that owner's Refresh", () => {
    const { g, jango, thatch } = start();
    useAbility(g, jango);
    pickInst(g, [thatch]);
    expect(g.power(thatch)).toBe(8000);
    toTheirMain(g);
    expect(g.card(g.find('p2', 'characters', W3C.thatch)).don).toBe(0);
    expect(don(g, 'p2')).toMatchObject({ given: 0, active: 7, rested: 0 });
  });
});
