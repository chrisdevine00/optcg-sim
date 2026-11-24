/**
 * OP16-102 Avalo Pizarro (Character, Yellow, cost 1, 2000, Counter +2000, {Blackbeard Pirates}/{Impel Down}).
 *
 * Card text: "[On K.O.] Draw 1 card, then play up to 1 [Fullalead] from your hand or trash.
 * [Trigger] Activate this card's [On K.O.] effect."
 *
 * Scenery: OP09-099 Fullalead (a Black Stage, cost 1, named [Fullalead]); OP05-021 Revolutionary Army
 * HQ is a Stage with another name.
 *
 * Rules: CR 10-2-1 ([On K.O.]), CR 10-1-5 / RD 101-102 ([Trigger]), CR 3-8 (one Stage area: a new
 * Stage replaces the old), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  cardIds,
  declineTrigger,
  deckOf,
  hand,
  hitLeader,
  kind,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickCards,
  SC16,
  theirs,
  theyKo,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-102';
const FULL = 'OP09-099'; // [Fullalead] Stage
const HQ = 'OP05-021'; // another Stage

function koed(o: { hand?: string[]; trash?: string[]; top?: string[]; stage?: string } = {}) {
  const g = theirs(
    LD16.teach,
    {
      characters: [{ card: ID, rested: true }],
      hand: o.hand ?? [],
      trash: o.trash ?? [],
      deck: deckOf(o.top ?? [BLUE]),
      stage: o.stage,
    },
    {},
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe('OP16-102 Avalo Pizarro: [On K.O.] draw 1, then play up to 1 [Fullalead] from hand or trash', () => {
  it("K.O.'d in battle: draws 1, then plays the [Fullalead] in my hand as my Stage", () => {
    const g = koed({ hand: [FULL] });
    need(g, 'choose', 'p1');
    pickCards(g, [FULL]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p1', 'stage')).toEqual([FULL]);
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g)).toEqual([ID]);
  });

  it('may play the [Fullalead] from the trash instead', () => {
    const g = koed({ trash: [FULL] });
    need(g, 'choose', 'p1');
    pickCards(g, [FULL]);
    expect(cardIds(g, 'p1', 'stage')).toEqual([FULL]);
    expect(trash(g)).toEqual([ID]);
  });

  it('with one [Fullalead] in hand and one in the trash, both are candidates and only one is played', () => {
    const g = koed({ hand: [FULL], trash: [FULL] });
    expect(offeredIds(g)).toEqual([FULL, FULL]);
    pickCards(g, [FULL]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p1', 'stage')).toEqual([FULL]);
    expect(
      hand(g).filter((c) => c === FULL).length + trash(g).filter((c) => c === FULL).length,
    ).toBe(1);
  });

  it('the draw comes first: a [Fullalead] on top of the deck is drawn and then playable', () => {
    const g = koed({ top: [FULL] });
    expect(offeredIds(g)).toEqual([FULL]);
    pickCards(g, [FULL]);
    expect(cardIds(g, 'p1', 'stage')).toEqual([FULL]);
    expect(hand(g)).toEqual([]);
  });

  it('only a card named [Fullalead] can be played: another Stage in hand is not offered', () => {
    const g = koed({ hand: [HQ, FULL], trash: [SC16.wano3] });
    expect(offeredIds(g)).toEqual([FULL]);
  });

  it('"up to 1": may play nothing; the draw still happened', () => {
    const g = koed({ hand: [FULL] });
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p1', 'stage')).toEqual([]);
    expect(hand(g).sort()).toEqual([BLUE, FULL].sort());
  });

  it('with no [Fullalead] the effect only draws 1 card', () => {
    const g = koed({ hand: [HQ] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g).sort()).toEqual([BLUE, HQ].sort());
  });

  it('a Stage already in play is replaced: the old Stage goes to the trash', () => {
    const g = koed({ hand: [FULL], stage: HQ });
    pickCards(g, [FULL]);
    expect(cardIds(g, 'p1', 'stage')).toEqual([FULL]);
    expect(trash(g)).toContain(HQ);
  });
});

describe("OP16-102 Avalo Pizarro: [Trigger] activate this card's [On K.O.] effect", () => {
  function hit(o: { hand?: string[]; trash?: string[] } = {}) {
    const g = theirs(
      LD16.teach,
      {
        life: [ID, BLUE, BLUE, BLUE],
        hand: o.hand ?? [],
        trash: o.trash ?? [],
        deck: deckOf([BLUE]),
      },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('activating from Life: draws 1, plays [Fullalead], and Pizarro is trashed (not in hand, not on the field)', () => {
    const g = hit({ hand: [FULL] });
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    pickCards(g, [FULL]);
    expect(cardIds(g, 'p1', 'stage')).toEqual([FULL]);
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g)).toEqual([ID]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('declining the [Trigger]: Pizarro goes to my hand and nothing is drawn', () => {
    const g = hit({ hand: [FULL] });
    declineTrigger(g);
    expect(hand(g).sort()).toEqual([FULL, ID].sort());
    expect(cardIds(g, 'p1', 'stage')).toEqual([]);
  });
});
