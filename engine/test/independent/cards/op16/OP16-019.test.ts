/**
 * OP16-019 Let's Show 'Em What We're Made Of!! (Event, Red, cost 9, {Whitebeard Pirates}).
 *
 * Card text: "[Main] Play up to 2 Character cards with a type including "Whitebeard Pirates" and 8000
 * power from your hand. [Trigger] Your Leader gains +1000 power during this turn."
 *
 * Rules: CR 8-5-1 (playing by an effect pays no cost), "up to 2" (CR 8-4-4-1), "a type including"
 * counts {Whitebeard Pirates Allies}, the Event costs 9 DON!! (CR 3-7), a played Character cannot
 * attack the turn it is played (CR 3-7-4), [Trigger] (CR 10-1-5) is used from the Life card.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canPlayCard,
  charIds,
  choices,
  choose,
  don,
  fill,
  hand,
  kind,
  mayChooseNone,
  mine,
  need,
  none,
  OL,
  OV,
  offeredIds,
  playCard,
  RED,
  BLUE,
  side,
  theirTurn,
  attack,
  activateTrigger,
  trash,
  noDefenceUntilTrigger,
  canHit,
  restedChar,
} from './kit-op16a.ts';

const EVENT = 'OP16-019';

function start(inHand: string[], chars: string[] = [], active = 10) {
  const g = mine(OL.ace, {
    hand: [EVENT, ...inHand],
    characters: chars,
    costArea: { active, rested: 10 - active },
  });
  playCard(g, EVENT);
  return g;
}

describe("OP16-019 Let's Show 'Em What We're Made Of!!: [Main] play up to 2 Whitebeard Pirates 8000-power Characters", () => {
  it('costs 9: not playable with 8 active DON!!, playable with 9', () => {
    const low = mine(OL.ace, { hand: [EVENT, OV.thatch], costArea: { active: 8, rested: 2 } });
    expect(canPlayCard(low, low.find('p1', 'hand', EVENT))).toBe(false);
    const ok = mine(OL.ace, { hand: [EVENT, OV.thatch], costArea: { active: 9, rested: 1 } });
    expect(canPlayCard(ok, ok.find('p1', 'hand', EVENT))).toBe(true);
  });

  it("plays both chosen Characters free of cost (only the Event's 9 is paid)", () => {
    const g = start([OV.thatch, OV.ramba]);
    need(g, 'choose', 'p1');
    choose(g, [g.find('p1', 'hand', OV.thatch), g.find('p1', 'hand', OV.ramba)]);
    expect(charIds(g, 'p1')).toEqual([OV.thatch, OV.ramba].sort());
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 9 });
    expect(trash(g)).toEqual([EVENT]);
    expect(atMain(g)).toBe(true);
  });

  it('boundary: only 8000-power Characters are offered (not 7000, 9000, or an 8000 without the type)', () => {
    const g = start([OV.thatch, OV.kingdew5, OV.oars9, OV.franky8, OV.curiel]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.curiel, OV.thatch].sort());
  });

  it('"a type including": a {Whitebeard Pirates Allies} Character with 8000 power is offered', () => {
    const g = start([OV.ramba, OV.franky8]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.ramba]);
  });

  it('plays at most 2 when three qualify', () => {
    const g = start([OV.thatch, OV.ramba, OV.curiel]);
    need(g, 'choose');
    expect(g.legal().some((a) => a.type === 'done')).toBe(true);
    choose(g, [g.find('p1', 'hand', OV.thatch), g.find('p1', 'hand', OV.ramba)]);
    expect(charIds(g, 'p1')).toEqual([OV.thatch, OV.ramba].sort());
    expect(hand(g)).toEqual([OV.curiel]);
  });

  it('"up to 2": one is fine', () => {
    const g = start([OV.thatch, OV.ramba]);
    choose(g, [g.find('p1', 'hand', OV.ramba)]);
    expect(charIds(g, 'p1')).toEqual([OV.ramba]);
    expect(hand(g)).toEqual([OV.thatch]);
  });

  it('"up to 2": may play none; the Event is spent anyway', () => {
    const g = start([OV.thatch]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(charIds(g, 'p1')).toEqual([]);
    expect(hand(g)).toEqual([OV.thatch]);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('with no qualifying Character in hand the Event can still be played and nothing is played', () => {
    const g = start([OV.kingdew5, OV.franky8]);
    expect(choices(g)).toEqual([]);
    if (kind(g) === 'choose') none(g);
    expect(charIds(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('the Characters enter active and cannot attack this turn', () => {
    const g = mine(
      OL.ace,
      { hand: [EVENT, OV.thatch] },
      { characters: [{ card: OV.sai4, rested: true }] },
    );
    playCard(g, EVENT);
    choose(g, [g.find('p1', 'hand', OV.thatch)]);
    expect(restedChar(g, 'p1', OV.thatch)).toBe(false);
    expect(
      canHit(g, at(g, 'p1', 'characters', OV.thatch), at(g, 'p2', 'characters', OV.sai4)),
    ).toBe(false);
  });
});

describe('OP16-019 [Trigger] Your Leader gains +1000 power during this turn', () => {
  /** p2 hits my Leader; the top Life card is the Event. */
  function triggered() {
    const g = theirTurn(
      side(OL.ace, BLUE, { life: [EVENT, ...fill(BLUE, 3)], hand: [OV.thatch] }),
      side(OL.luffy, RED, {}),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    return g;
  }

  it('activating the [Trigger] gives my Leader +1000 (6000) and does not play Characters', () => {
    const g = triggered();
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(charIds(g, 'p1')).toEqual([]);
    expect(hand(g)).toEqual([OV.thatch]);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('declining the [Trigger] adds the card to hand and the Leader stays 5000', () => {
    const g = triggered();
    g.act({ type: 'trigger', activate: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([EVENT, OV.thatch].sort());
  });

  it('the bonus ends with the turn: back to 5000 in my next turn', () => {
    const g = triggered();
    activateTrigger(g);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("must not: the opponent's Leader gets nothing", () => {
    const g = triggered();
    activateTrigger(g);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});
