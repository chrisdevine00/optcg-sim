/**
 * ST20-004 Charlotte Pudding (Yellow Character, cost 3, 2000, Counter +1000, {Big Mom Pirates}).
 * "[On Play] You may add 1 card from the top of your Life cards to your hand: Set up to 1 of your
 * "Big Mom Pirates" type Characters with a cost of 3 or less as active.
 * [Trigger] Rest up to 1 of your opponent's Characters with a cost of 3 or less."
 * Rules: the cost takes the TOP Life card (no [Trigger] check for a card added by an effect); the
 * optional cost over the Life area is offered even when unpayable (the Life is hidden); "up to 1"
 * allows no target.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  cost,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LD,
  many,
  mine,
  unusable,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  playId,
  restedChar,
  SC,
  theirs,
  yes,
} from './kit-st1821a.ts';

const ID = 'ST20-004';

function start(chars: (string | { card: string; rested?: boolean })[], life = many(BLUE, 4)) {
  return mine(LD.katakuri, { hand: [ID], characters: chars, life, ...cost(10) });
}

describe('ST20-004 Charlotte Pudding: [On Play] add the top Life card to hand: set a {Big Mom Pirates} Character (cost 3 or less) active', () => {
  it('paying takes the top Life card into my hand and offers my {Big Mom Pirates} Characters of cost 3 or less', () => {
    const g = start([
      { card: SC.bmp1, rested: true },
      { card: SC.bmp2, rested: true },
      { card: SC.bmp4, rested: true },
      { card: SC.yplain1, rested: true },
    ]);
    playId(g, ID);
    yes(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([BLUE]);
    need(g, 'choose', 'p1');
    const offered = offeredIds(g);
    expect(offered).toContain(SC.bmp1);
    expect(offered).toContain(SC.bmp2);
    expect(offered).not.toContain(SC.bmp4);
    expect(offered).not.toContain(SC.yplain1);
  });

  it('the chosen rested Character becomes active; the other rested ones stay rested', () => {
    const g = start([
      { card: SC.bmp1, rested: true },
      { card: SC.bmp2, rested: true },
    ]);
    playId(g, ID);
    yes(g, 'p1');
    pickCards(g, [SC.bmp2]);
    expect(atMain(g)).toBe(true);
    expect(restedChar(g, 'p1', SC.bmp2)).toBe(false);
    expect(restedChar(g, 'p1', SC.bmp1)).toBe(true);
  });

  it('cost boundary: a {Big Mom Pirates} Character of cost 4 is not offered, cost 3 is', () => {
    const g = start([
      { card: SC.bmp3, rested: true },
      { card: SC.bmp4, rested: true },
    ]);
    playId(g, ID);
    yes(g, 'p1');
    expect(offeredIds(g)).toContain(SC.bmp3);
    expect(offeredIds(g)).not.toContain(SC.bmp4);
  });

  it('the type must be {Big Mom Pirates}: a rested Yellow Character of another type is never offered', () => {
    const g = start([{ card: SC.yplain1, rested: true }]);
    playId(g, ID);
    yes(g, 'p1');
    expect(offeredIds(g)).not.toContain(SC.yplain1);
  });

  it('"up to 1": choosing nothing leaves every Character as it was (the Life card is still added)', () => {
    const g = start([{ card: SC.bmp1, rested: true }]);
    playId(g, ID);
    yes(g, 'p1');
    none(g);
    expect(restedChar(g, 'p1', SC.bmp1)).toBe(true);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([BLUE]);
  });

  it('declining the optional cost: no Life card is added and nobody is set active', () => {
    const g = start([{ card: SC.bmp1, rested: true }]);
    playId(g, ID);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
    expect(restedChar(g, 'p1', SC.bmp1)).toBe(true);
  });

  it('with no Life cards the cost is not payable (offered with accept illegal, or not asked) and nothing happens', () => {
    const g = start([{ card: SC.bmp1, rested: true }], []);
    playId(g, ID);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(restedChar(g, 'p1', SC.bmp1)).toBe(true);
    expect(hand(g)).toEqual([]);
  });
});

describe('ST20-004 Charlotte Pudding: [Trigger] rest up to 1 opposing Character with a cost of 3 or less', () => {
  function hit(opp: string[]) {
    const g = theirs(LD.katakuri, { life: [ID, BLUE, BLUE, BLUE] }, { characters: opp });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('offers exactly the opposing Characters of cost 3 or less; the pick is rested', () => {
    const g = hit([SC.c1, SC.c3, SC.c4, SC.c5]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c1, SC.c3].sort());
    pickCards(g, [SC.c3]);
    expect(restedChar(g, 'p2', SC.c3)).toBe(true);
    expect(restedChar(g, 'p2', SC.c1)).toBe(false);
    expect(restedChar(g, 'p2', SC.c4)).toBe(false);
  });

  it('"up to 1": may rest nothing; declining the [Trigger] puts the card in my hand and rests nobody', () => {
    const g = hit([SC.c3]);
    declineTrigger(g);
    expect(restedChar(g, 'p2', SC.c3)).toBe(false);
    expect(hand(g)).toEqual([ID]);
    expect(kind(g)).toBe('main');
  });
});
