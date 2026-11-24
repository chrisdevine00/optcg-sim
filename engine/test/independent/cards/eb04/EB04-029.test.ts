/**
 * EB04-029 I Heard the Sound...of a Lady's Teardrops Falling (Event, Blue, cost 1).
 *
 * Card text: "[Main] If your Leader is [Sanji], look at 3 cards from the top of your deck; reveal up
 * to 1 [Sanji] or Event card and add it to your hand. Then, trash the rest."
 * "[Counter] You may trash 1 card from your hand: Up to 1 of your [Sanji] cards gains +4000 power
 * during this battle."
 *
 * Rules: [Sanji] is a card name; a Leader named Sanji is a [Sanji] card. Revealing the chosen card
 * (CR 11-2-1). "Up to" may be none. The looked-at cards that are not added are trashed.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  at,
  attack,
  BLUE,
  canCounterNow,
  chars,
  deck,
  EVT,
  fill,
  hand,
  hasEvent,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  payCard,
  pickRaw,
  playRaw,
  theirs,
  trash,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-029';
/** EB04-052 Sanji: Yellow Character, cost 4, 4000, named [Sanji]. */
const SANJI = 'EB04-052';
/** OP01-012 Sai: Red, cost 2, 4000, vanilla, not named Sanji. */
const SAI = 'OP01-012';
/** OP01-018 Hajrudin: Red, cost 4, 6000, vanilla. */
const HAJ = 'OP01-018';

function main(top: string[], leader: string = LB.sanji): TestGame {
  const g = mine(leader, { hand: [ID], deck: [...top, ...fill(BLUE, 10)] });
  playRaw(g, ID);
  return g;
}

describe('EB04-029 [Main]: look at 3, add up to 1 [Sanji] or Event, trash the rest', () => {
  it('offers exactly the [Sanji] and Event cards among the top 3; the pick goes to hand, the rest to trash', () => {
    const g = main([SANJI, EVT, SAI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EVT, SANJI].sort());
    pickRaw(g, g.find('p1', 'deck', SANJI));
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SANJI]);
    expect(trash(g)).toEqual([EVT, ID, SAI].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('an Event card can be the one added', () => {
    const g = main([SANJI, EVT, SAI]);
    pickRaw(g, g.find('p1', 'deck', EVT));
    expect(hand(g)).toEqual([EVT]);
    expect(trash(g)).toEqual([ID, SANJI, SAI].sort());
  });

  it('"up to 1": may add nothing; all three go to the trash', () => {
    const g = main([SANJI, EVT, SAI]);
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([EVT, ID, SANJI, SAI].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('adds at most one even when two qualify', () => {
    const g = main([SANJI, EVT, SAI]);
    pickRaw(g, g.find('p1', 'deck', SANJI));
    expect(hand(g)).toHaveLength(1);
    expect(kind(g)).toBe('main');
  });

  it('only the top 3 are looked at: a [Sanji] in 4th place stays on the deck', () => {
    const g = main([SAI, SAI, SAI, SANJI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(trash(g)).toEqual([ID, SAI, SAI, SAI].sort());
    expect(deck(g)[0]).toBe(SANJI);
  });

  it('the chosen card is revealed; the trashed cards are not', () => {
    const g = main([SANJI, EVT, SAI]);
    pickRaw(g, g.find('p1', 'deck', SANJI));
    expect(hasEvent(g, 'CardRevealed', { card: SANJI })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: SAI })).toBe(false);
  });

  it('without a [Sanji] Leader nothing is looked at and the deck is untouched', () => {
    const g = main([SANJI, EVT, SAI], LB.neutral);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(SANJI);
  });

  it('a Leader that only has the Straw Hat Crew type is not [Sanji]', () => {
    const g = main([SANJI, EVT, SAI], LB.luffy);
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(13);
  });

  it('a non-[Sanji], non-Event card is never offered', () => {
    const g = main([SAI, BLUE, SANJI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SANJI]);
  });
});

describe('EB04-029 [Counter]: trash 1, up to 1 [Sanji] gains +4000 this battle', () => {
  /** p2 attacks p1 (Sanji Leader, 5000) with a 6000 Character; p1 may counter with the Event. */
  function defending(hnd: string[], extra: Partial<{ characters: string[] }> = {}): TestGame {
    const g = theirs(
      LB.sanji,
      {
        hand: hnd,
        costArea: { active: 3, rested: 0 },
        life: fill(BLUE, 4),
        deck: fill(BLUE, 10),
        ...extra,
      },
      { characters: [HAJ] },
    );
    attack(g, at(g, 'p2', 'characters', HAJ), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('is usable in the Counter Step', () => {
    const g = defending([ID, BLUE]);
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(true);
  });

  it('the Sanji Leader survives a 6000 attack with +4000 (cost trashed, Event spent)', () => {
    const g = defending([ID, BLUE]);
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'optional', 'p1');
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    if (kind(g) === 'choose') pickRaw(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([BLUE, ID].sort());
  });

  it('without the Counter the same attack takes a Life card', () => {
    const g = defending([ID, BLUE]);
    g.act({ type: 'endCounter' });
    while (kind(g) === 'trigger') g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
  });

  it('the +4000 ends with the battle', () => {
    const g = defending([ID, BLUE]);
    activateCounter(g, g.find('p1', 'hand', ID));
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    if (kind(g) === 'choose') pickRaw(g, g.leader('p1'));
    g.act({ type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only [Sanji] cards can be chosen: another Character is not offered, a [Sanji] Character is', () => {
    const g = defending([ID, BLUE], { characters: [SAI, SANJI] });
    activateCounter(g, g.find('p1', 'hand', ID));
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SANJI, LB.sanji].sort());
    expect(offeredIds(g)).not.toContain(SAI);
  });

  it('may be declined at the "you may" question: nothing is trashed and no power is gained', () => {
    const g = defending([ID, BLUE]);
    activateCounter(g, g.find('p1', 'hand', ID));
    if (kind(g) === 'optional') g.act({ type: 'optional', accept: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([BLUE]);
  });

  it('with no other card in hand the cost cannot be paid and no power is gained', () => {
    const g = defending([ID]);
    const ev = g.find('p1', 'hand', ID);
    if (canCounterNow(g, ev)) {
      activateCounter(g, ev);
      if (kind(g) === 'optional') {
        expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        g.act({ type: 'optional', accept: false });
      }
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character named [Sanji] receives the boost when chosen', () => {
    const g = defending([ID, BLUE], { characters: [SANJI] });
    activateCounter(g, g.find('p1', 'hand', ID));
    g.act({ type: 'optional', accept: true });
    payCard(g, BLUE);
    pickRaw(g, g.find('p1', 'characters', SANJI));
    expect(g.power(g.find('p1', 'characters', SANJI))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(chars(g)).toEqual([SANJI]);
  });
});
