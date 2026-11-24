/**
 * EB05-037 Black Maria (Character, Purple, cost 1, 2000, Counter +2000, {Animal Kingdom Pirates}).
 *
 * Card text: "[On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Animal Kingdom
 * Pirates} type card and add it to your hand. Then, place the rest at the bottom of your deck in
 * any order."
 *
 * Rules: CR 8-4-4-1/-2/-4 ("up to" and a hidden-area search may whiff), a {type} filter accepts any
 * card category with the type and any multi-type card that includes it. There is no condition.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  BLUE,
  CH,
  checkLook,
  deck,
  describeLookAdd,
  hand,
  LD,
  mine,
  playCard,
  STRIKE_FILL,
  YL,
} from './kit-b.ts';

const ID = 'EB05-037';

describeLookAdd({
  id: ID,
  title: 'Black Maria',
  n: 3,
  leader: YL.neutral,
  match: [CH.dobon, CH.solitaire],
  miss: STRIKE_FILL,
  beyond: CH.ginrummy,
});

describe('EB05-037 Black Maria [On Play]: more cases', () => {
  const start = (top: string[], leader: string = LD.shc) => {
    const g = mine(leader, { hand: [ID], deck: [...top, ...fill(BLUE, 12)] });
    playCard(g, ID);
    return g;
  };

  it('there is no Leader condition: it works under a Leader of any type', () => {
    const g = start([CH.dobon, STRIKE_FILL, STRIKE_FILL], LD.nami);
    checkLook(g, { candidates: [CH.dobon], pick: [CH.dobon] });
    expect(hand(g)).toEqual([CH.dobon]);
  });

  it('an Event with the {Animal Kingdom Pirates} type is offered too (any card category)', () => {
    const g = start(['EB04-040', STRIKE_FILL, STRIKE_FILL]);
    checkLook(g, { candidates: ['EB04-040'], pick: ['EB04-040'] });
    expect(hand(g)).toEqual(['EB04-040']);
  });

  it('a card of another type is never offered even when it is the only one looked at', () => {
    const g = start([STRIKE_FILL, CH.marco, CH.sai]);
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g).slice(-3).sort()).toEqual([STRIKE_FILL, CH.marco, CH.sai].sort());
  });

  it('with the matching card second and third, the first looked-at card goes to the bottom', () => {
    const g = start([STRIKE_FILL, CH.dobon, CH.solitaire]);
    checkLook(g, { candidates: [CH.dobon, CH.solitaire], pick: [CH.solitaire] });
    expect(hand(g)).toEqual([CH.solitaire]);
    expect(deck(g)).toHaveLength(12 + 2);
  });
});
