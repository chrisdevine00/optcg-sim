/**
 * OP14-097 Hurry Up and Make Me the Pirate King! (Event, Black, cost 1, {The Seven Warlords of the
 * Sea}/{Thriller Bark Pirates}).
 *
 * Card text: "[Main] Look at 3 cards from the top of your deck; reveal up to 1 {Thriller Bark Pirates}
 * type card other than [Hurry Up and Make Me the Pirate King!] and add it to your hand. Then, trash
 * the rest.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 8-4-4, CR 10-2-3 ([Main]), CR 10-1-5 ([Trigger]), RD 105 (activating a [Main] from a
 * [Trigger] still pays that [Main]'s own cost; this one has none).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
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
  TB,
  theirs,
  trash,
} from './kit-op14d.ts';

const ID = 'OP14-097';

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
  // A Stage and a Character: any category of {Thriller Bark Pirates} card qualifies.
  match: [TB.lola4, TB.stage],
  multi: TB.moria4,
  excluded: ID,
  miss: SC14.c2,
});

describe('OP14-097 Hurry Up and Make Me the Pirate King!: [Main] costs 1; [Trigger] activates the [Main]', () => {
  it('playing it costs 1 DON!!, and the Event itself ends in the trash with the rest', () => {
    const g = mine(LD14.neutral, { hand: [ID], deck: deckTop([TB.lola4, SC14.c2, SC14.c4]) });
    playId(g, ID);
    pickCards(g, [TB.lola4]);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    expect(trash(g)).toEqual([ID, SC14.c2, SC14.c4].sort());
    expect(hand(g)).toEqual([TB.lola4]);
  });

  function triggered(top: string[]) {
    const g = theirs(LD14.neutral, { life: [ID, BLUE, BLUE, BLUE], deck: top }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('[Trigger]: activating runs the [Main] (look at 3, take 1 {Thriller Bark Pirates} card, trash the rest) with no DON!! paid', () => {
    const g = triggered(deckTop([TB.moria4, SC14.c2, TB.stage]));
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TB.moria4, TB.stage].sort());
    pickCards(g, [TB.stage]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toContain(TB.stage);
    expect(trash(g)).toEqual([ID, TB.moria4, SC14.c2].sort());
    expect(don(g, 'p1').active).toBe(0);
  });

  it('[Trigger] declined: the Event goes to my hand, the deck is untouched', () => {
    const g = triggered(deckTop([TB.moria4, SC14.c2, TB.stage]));
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toContain(ID);
    expect(deck(g).slice(0, 3)).toEqual([TB.moria4, SC14.c2, TB.stage]);
    expect(trash(g)).toEqual([]);
  });

  it('a second copy of the Event is never offered: it is excluded by name even though its type matches', () => {
    const g = triggered(deckTop([ID, TB.lola4, SC14.c2]));
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([TB.lola4]);
  });
});
