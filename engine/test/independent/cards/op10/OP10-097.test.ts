/**
 * OP10-097 Gum-Gum Rhino Schneider (Event, Black, cost 1, {Straw Hat Crew}/{Supernovas}/{Dressrosa}).
 *
 * Card text: "[Main] Up to 1 of your {Dressrosa} type Characters gains +2000 power during this turn.
 * Then, if you have 10 or more cards in your trash, that card gains [Banish] during this turn.
 * [Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: RL-09 ("during this turn"), CR 8-4-4-1 ("up to"), CR 2-7-3 (an Event is in the trash
 * while its effect resolves, so it counts towards the 10), CR 10-1-5 ([Trigger]), E-Q-trash (a
 * "trash 1 from your hand" is a forced pick).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  declineTrigger,
  deck,
  fill,
  hand,
  hitLeader,
  kind,
  kw,
  LD10,
  mayDone,
  mine,
  need,
  none,
  offeredInst,
  pickCards,
  pickInst,
  playId,
  SC10,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-097';

function main(o: { trashN?: number; own?: string[] } = {}) {
  const g = mine(LD10.neutral, {
    hand: [ID],
    characters: o.own ?? [SC10.dr3, SC10.c3],
    trash: fill(BLUE, o.trashN ?? 0),
  });
  playId(g, ID);
  return g;
}

describe('OP10-097 [Main]: a {Dressrosa} Character gains +2000, and [Banish] with 10 or more cards in the trash', () => {
  it('gives the chosen {Dressrosa} Character +2000 (5000 becomes 7000) and no [Banish] with a small trash', () => {
    const g = main();
    need(g, 'choose', 'p1');
    const dr = g.find('p1', 'characters', SC10.dr3);
    pickInst(g, [dr]);
    expect(g.power(dr)).toBe(7000);
    expect(kw(g, dr)).not.toContain('Banish');
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ID]);
  });

  it('offers only my {Dressrosa} Characters: not my other Characters, not my Leader', () => {
    const g = main({ own: [SC10.dr3, SC10.dr5, SC10.c3] });
    expect(offeredInst(g)).toEqual(
      [g.find('p1', 'characters', SC10.dr3), g.find('p1', 'characters', SC10.dr5)].sort(),
    );
  });

  it('a {Dressrosa} Leader is not a Character: it is never offered', () => {
    const g = mine('OP10-042', { hand: [ID], characters: [SC10.dr3] });
    playId(g, ID);
    expect(offeredInst(g)).toEqual([g.find('p1', 'characters', SC10.dr3)]);
  });

  it('only my own Characters: the opposing {Dressrosa} Character is not offered', () => {
    const g = mine(
      LD10.neutral,
      { hand: [ID], characters: [SC10.dr3] },
      { characters: [SC10.dr5] },
    );
    playId(g, ID);
    expect(offeredInst(g)).toEqual([g.find('p1', 'characters', SC10.dr3)]);
  });

  it('with 10 cards in the trash besides the Event the target gains [Banish] this turn as well', () => {
    const g = main({ trashN: 10 });
    const dr = g.find('p1', 'characters', SC10.dr3);
    pickInst(g, [dr]);
    expect(g.power(dr)).toBe(7000);
    expect(kw(g, dr)).toContain('Banish');
  });

  it('boundary: 8 other cards (9 with the Event) give no [Banish]; 10 other cards do', () => {
    const eight = main({ trashN: 8 });
    const dr8 = eight.find('p1', 'characters', SC10.dr3);
    pickInst(eight, [dr8]);
    expect(kw(eight, dr8)).not.toContain('Banish');
    const ten = main({ trashN: 10 });
    const dr10 = ten.find('p1', 'characters', SC10.dr3);
    pickInst(ten, [dr10]);
    expect(kw(ten, dr10)).toContain('Banish');
  });

  it('[Banish] goes only to the chosen card, and both bonuses end with the turn', () => {
    const g = main({ trashN: 10, own: [SC10.dr3, SC10.dr5] });
    const a = g.find('p1', 'characters', SC10.dr3);
    const b = g.find('p1', 'characters', SC10.dr5);
    pickInst(g, [a]);
    expect(kw(g, b)).not.toContain('Banish');
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(g.power(a)).toBe(5000);
    expect(kw(g, a)).not.toContain('Banish');
  });

  it('"up to 1": may choose nothing: no power and no [Banish] anywhere', () => {
    const g = main({ trashN: 10 });
    expect(mayDone(g)).toBe(true);
    none(g);
    const dr = g.find('p1', 'characters', SC10.dr3);
    expect(g.power(dr)).toBe(5000);
    expect(kw(g, dr)).not.toContain('Banish');
  });

  it('with no {Dressrosa} Character of mine nothing happens (no one gets [Banish])', () => {
    const g = main({ trashN: 10, own: [SC10.c3] });
    if (mayDone(g)) {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    expect(kw(g, g.find('p1', 'characters', SC10.c3))).not.toContain('Banish');
    expect(g.power(g.find('p1', 'characters', SC10.c3))).toBe(5000);
  });
});

describe('OP10-097 [Trigger]: draw 2 cards and trash 1 card from your hand', () => {
  function trig(hnd: string[] = [SC10.c3]) {
    const g = theirs(LD10.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      hand: hnd,
      deck: [SC10.c6, SC10.c7, BLUE, BLUE, BLUE],
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('draws 2 cards and then trashes 1 chosen card from the hand (net +1)', () => {
    const g = trig();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SC10.c3]);
    expect(hand(g)).toEqual([SC10.c6, SC10.c7].sort());
    expect(trash(g)).toEqual([ID, SC10.c3].sort());
    expect(deck(g)).toHaveLength(3);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('a card just drawn may be the one trashed', () => {
    const g = trig();
    activateTrigger(g);
    pickCards(g, [SC10.c7]);
    expect(hand(g)).toEqual([SC10.c3, SC10.c6].sort());
    expect(trash(g)).toContain(SC10.c7);
  });

  it('the trash is exactly 1 card: the pick is not "up to"', () => {
    const g = trig();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(mayDone(g)).toBe(false);
  });

  it('declining the [Trigger]: the Event goes to my hand, nothing is drawn', () => {
    const g = trig();
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, SC10.c3].sort());
    expect(deck(g)).toHaveLength(5);
    expect(kind(g)).toBe('main');
  });
});
