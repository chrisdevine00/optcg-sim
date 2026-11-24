/**
 * OP02-068 Gum-Gum Rain (Event, Blue, cost 0, {Straw Hat Crew}/{Impel Down}).
 *
 * Card text: "[Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Character cards
 * gains +3000 power during this battle.
 * [Trigger] Return up to 1 Character with a cost of 2 or less to the owner's hand."
 *
 * Rules: [Counter] (CR 10-2-4): "you may" cost declined or unpayable means no boost; "during this
 * battle" ends with the battle. [Trigger] (CR 10-1-5) activates only when taken as damage; "up to 1"
 * lets the player choose nothing; it targets any player's Character (not Leaders) of cost 2 or less
 * and returns it to ITS OWNER's hand.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  C29,
  declineTrigger,
  describeTrashCounter,
  fill,
  hand,
  hitLeader,
  ids29,
  isMain,
  kind,
  L29,
  need,
  none,
  offeredIds,
  pickInst,
  theirs,
  inst,
} from './kit-st29a.ts';

const ID = 'OP02-068';

describeTrashCounter({ id: ID });

describe("OP02-068 Gum-Gum Rain [Trigger] return up to 1 Character with cost 2 or less to the owner's hand", () => {
  const hit = (mineChars: string[], p2chars: string[]) => {
    const g = theirs(
      L29.croc,
      { life: [ID, ...fill(C29.c1, 3)], characters: mineChars },
      { characters: p2chars },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  };

  it('offers Characters of either side with cost 2 or less, not cost 3, and no Leaders', () => {
    const g = hit([C29.c1, C29.c3], [C29.c2, C29.c4]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c1, C29.c2].sort());
  });

  it("returns an opposing Character to ITS owner's (p2's) hand", () => {
    const g = hit([], [C29.c2]);
    activateTrigger(g);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c2)]);
    expect(ids29(g, 'p2', 'characters')).toEqual([]);
    expect(hand(g, 'p2')).toEqual([C29.c2]);
    expect(ids29(g, 'p1', 'trash')).toEqual([ID]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('may return my own Character to my hand', () => {
    const g = hit([C29.c1], [C29.c2]);
    activateTrigger(g);
    pickInst(g, [inst(g, 'p1', 'characters', C29.c1)]);
    expect(hand(g)).toEqual([C29.c1]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c2]);
  });

  it('"up to 1": choosing nothing returns nothing', () => {
    const g = hit([C29.c1], [C29.c2]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(ids29(g, 'p1', 'characters')).toEqual([C29.c1]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c2]);
  });

  it('with no Character of cost 2 or less on either side nothing can be returned', () => {
    const g = hit([C29.c3], [C29.c4]);
    activateTrigger(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(ids29(g, 'p1', 'characters')).toEqual([C29.c3]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c4]);
  });

  it('declining the [Trigger] adds the Event to my hand and returns nothing', () => {
    const g = hit([], [C29.c2]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c2]);
  });
});
