/**
 * OP03-097 Six King Pistol (Event, Black, cost 0, {CP9}).
 *
 * Card text: "[Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Character cards
 * gains +3000 power during this battle.
 * [Trigger] Draw 1 card. Then, K.O. up to 1 of your opponent's Characters with a cost of 1 or less."
 *
 * Rules: [Counter] (CR 10-2-4) as in the other cost-0 trash Counters. [Trigger] (CR 10-1-5): draw
 * first; "Then" continues regardless of the draw; the K.O. is "up to 1" and limited to opposing
 * Characters of cost 1 or less (cost 0 and 1 qualify).
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
  inst,
  isMain,
  kind,
  L29,
  need,
  none,
  offeredIds,
  pickInst,
  theirs,
} from './kit-st29a.ts';

const ID = 'OP03-097';

describeTrashCounter({ id: ID });

describe('OP03-097 Six King Pistol [Trigger] draw 1, then K.O. up to 1 Character with cost 1 or less', () => {
  const hit = (p2chars: string[], mineChars: string[] = []) => {
    const g = theirs(
      L29.croc,
      { life: [ID, ...fill(C29.c1, 3)], deck: fill(C29.c4, 15), characters: mineChars },
      { characters: p2chars },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  };

  it('draws 1 card first, then offers only opposing Characters with cost 1 or less', () => {
    const g = hit([C29.c1, C29.red1, C29.c2, C29.c3]);
    activateTrigger(g);
    expect(hand(g)).toEqual([C29.c4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c1, C29.red1].sort());
  });

  it('K.O.s the chosen Character; the Event ends in the trash', () => {
    const g = hit([C29.c1, C29.c2]);
    activateTrigger(g);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c1)]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c2]);
    expect(ids29(g, 'p2', 'trash')).toEqual([C29.c1]);
    expect(ids29(g, 'p1', 'trash')).toEqual([ID]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('a cost-2 Character is out of range: with only cost 2 and 3 Characters nothing can be K.O.d but the card is drawn', () => {
    const g = hit([C29.c2, C29.c3]);
    activateTrigger(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toEqual([C29.c4]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c2, C29.c3].sort());
  });

  it('"up to 1": choosing nothing K.O.s nothing; the draw stays', () => {
    const g = hit([C29.c1]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(hand(g)).toEqual([C29.c4]);
  });

  it('only opposing Characters are K.O. targets: my own cost-1 Character is not offered', () => {
    const g = hit([C29.red1], [C29.c1]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.red1]);
  });

  it('only 1 Character is K.O.d even when two qualify', () => {
    const g = hit([C29.c1, C29.red1]);
    activateTrigger(g);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c1)]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.red1]);
  });

  it('declining the [Trigger] adds the Event to my hand: no draw, no K.O.', () => {
    const g = hit([C29.c1]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
  });
});
