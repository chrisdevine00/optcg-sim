/**
 * OP14-099 Disappointed? (Event, Black, cost 1, {Baroque Works}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Main] Look at 3 cards from the top of your deck; reveal up to 1 card with a type
 * including "Baroque Works" other than [Disappointed?] and add it to your hand. Then, trash the rest.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 8-4-4, CR 10-2-3, CR 10-1-5, RD 105. Any category of card qualifies, not only Characters.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  BW,
  deck,
  deckTop,
  describeLook,
  don,
  hand,
  hitLeader,
  LD14,
  mine,
  need,
  offeredIds,
  pickCards,
  playId,
  SC14,
  theirs,
  trash,
} from './kit-op14d.ts';

const ID = 'OP14-099';
/** OP14-098 Crescent Cutlass: an Event whose type is {Impel Down}/{Former Baroque Works}. */
const EVENT_BW = 'OP14-098';

describeLook({
  id: ID,
  n: 3,
  main: 'p1',
  rest: 'trash',
  start: (top) => {
    const g = mine(LD14.neutral, { hand: [ID], deck: top });
    playId(g, ID);
    return g;
  },
  match: [BW.mr9, BW.valentine],
  multi: BW.daz,
  excluded: ID,
  miss: SC14.c2,
});

describe('OP14-099 Disappointed?: any Baroque Works card; [Trigger] activates the [Main]', () => {
  it('a Baroque Works Event (type {Former Baroque Works}) qualifies together with a Character', () => {
    const g = mine(LD14.neutral, { hand: [ID], deck: deckTop([EVENT_BW, BW.mr9, SC14.c2]) });
    playId(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EVENT_BW, BW.mr9].sort());
  });

  it('works with a Leader of any type (no condition): costs 1 DON!!, the Event ends in the trash with the rest', () => {
    const g = mine(LD14.luffy, { hand: [ID], deck: deckTop([BW.mr9, SC14.c2, SC14.c4]) });
    playId(g, ID);
    pickCards(g, [BW.mr9]);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    expect(trash(g)).toEqual([ID, SC14.c2, SC14.c4].sort());
    expect(hand(g)).toEqual([BW.mr9]);
  });

  function triggered(top: string[]) {
    const g = theirs(LD14.neutral, { life: [ID, BLUE, BLUE, BLUE], deck: top }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('[Trigger]: activating runs the [Main] with no DON!! paid; the Event is trashed afterwards', () => {
    const g = triggered(deckTop([BW.daz, SC14.c2, BW.mr9]));
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BW.daz, BW.mr9].sort());
    pickCards(g, [BW.mr9]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toContain(BW.mr9);
    expect(trash(g)).toEqual([ID, BW.daz, SC14.c2].sort());
    expect(don(g, 'p1').active).toBe(0);
  });

  it('[Trigger] declined: the Event goes to my hand and the deck is untouched', () => {
    const g = triggered(deckTop([BW.daz, SC14.c2, BW.mr9]));
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toContain(ID);
    expect(deck(g).slice(0, 3)).toEqual([BW.daz, SC14.c2, BW.mr9]);
  });
});
