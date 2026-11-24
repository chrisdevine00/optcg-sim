/**
 * ST29-004 Sanji (Character, Yellow, cost 4, 5000, Counter +1000, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "[On Play] Look at 4 cards from the top of your deck; reveal up to 1 {Straw Hat Crew} type
 * card and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 * [Trigger] You may trash 1 card from your hand: Play this card."
 *
 * Rules: only the top 4 are looked at; only {Straw Hat Crew} cards may be taken ("up to 1": none is
 * allowed); the rest go to the bottom. A [Trigger] that plays the card puts it on the field, where
 * its [On Play] fires (CR 10-1-5). A "you may" cost can be declined, and an unpayable one (empty
 * hand) cannot be paid; an activated Trigger that does not play the card ends in the trash.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  C29,
  deck,
  fill,
  hand,
  hitLeader,
  ids29,
  inst,
  isMain,
  L29,
  mine,
  need,
  declineTrigger,
  none,
  offeredIds,
  payCost29,
  pickInst,
  playRaw,
  settleOrders,
  theirs,
  unusable,
} from './kit-st29a.ts';

const SANJI = 'ST29-004';
const SHC = C29.shc4; // ST01-010 Franky, {Straw Hat Crew}
const SHC2 = C29.zoroSn; // OP02-043 Zoro, {Straw Hat Crew}

/** p1's Main Phase with Sanji in hand and this deck (top first). */
function main(deckTop: string[]) {
  return mine(L29.croc, {
    hand: [SANJI],
    deck: [...deckTop, ...fill(C29.c1, 15 - deckTop.length)],
  });
}

describe('ST29-004 Sanji [On Play]: look at 4, take up to 1 {Straw Hat Crew}, rest to the bottom', () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = main([]);
    const s = inst(g, 'p1', 'hand', SANJI);
    expect(g.card(s).cost).toBe(4);
    expect(g.card(s).power).toBe(5000);
    expect(g.card(s).counter).toBe(1000);
  });

  it('offers only the {Straw Hat Crew} cards among the top 4, never the 5th card', () => {
    const g = main([C29.c2, SHC, C29.c3, SHC2, C29.shc4]);
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SHC, SHC2].sort());
  });

  it('taking one adds exactly that card to my hand and puts the other 3 looked-at cards at the bottom', () => {
    const top = [C29.c2, SHC, C29.c3, SHC2, C29.c4];
    const g = main(top);
    playRaw(g, SANJI);
    pickInst(g, [inst(g, 'p1', 'deck', SHC2)]);
    settleOrders(g);
    expect(hand(g)).toEqual([SHC2]);
    expect(deck(g)).toHaveLength(14);
    // The 5th card is now on top; the bottom 3 are the other looked-at cards in some order.
    expect(deck(g)[0]).toBe(C29.c4);
    expect(deck(g).slice(-3).sort()).toEqual([C29.c2, SHC, C29.c3].sort());
    expect(isMain(g, 'p1')).toBe(true);
  });

  it('"up to 1": taking none puts all 4 looked-at cards at the bottom', () => {
    const g = main([C29.c2, SHC, C29.c3, SHC2, C29.c4]);
    playRaw(g, SANJI);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(C29.c4);
    expect(deck(g).slice(-4).sort()).toEqual([C29.c2, SHC, C29.c3, SHC2].sort());
  });

  it('with no {Straw Hat Crew} card in the top 4 nothing can be taken, even if the 5th is one', () => {
    const g = main([C29.c2, C29.c3, C29.c4, C29.c5, SHC]);
    playRaw(g, SANJI);
    if (g.decider === 'p1' && offeredIds(g).length) throw new Error('a non-candidate was offered');
    // Either no prompt or an empty up-to prompt; end it.
    if (!isMain(g, 'p1')) none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(SHC);
  });

  it('with a deck of only 3 cards it looks at those 3', () => {
    const g = mine(L29.croc, { hand: [SANJI], deck: [C29.c2, SHC, C29.c3] });
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SHC]);
    pickInst(g, [inst(g, 'p1', 'deck', SHC)]);
    settleOrders(g);
    expect(hand(g)).toEqual([SHC]);
    expect(deck(g).sort()).toEqual([C29.c2, C29.c3].sort());
  });
});

describe('ST29-004 Sanji [Trigger]: may trash 1 card from hand to play this card', () => {
  /** p2 hits my Leader; my top Life card is Sanji; I hold `handCards`. Stops at the trigger decision. */
  function hit(handCards: string[]) {
    const g = theirs(
      L29.croc,
      { life: [SANJI, ...fill(C29.c1, 3)], hand: handCards, deck: [SHC, ...fill(C29.c1, 14)] },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('paying the cost (trashing the chosen hand card) plays Sanji and his [On Play] then fires', () => {
    const g = hit([C29.c2, C29.c3]);
    activateTrigger(g);
    payCost29(g, [inst(g, 'p1', 'hand', C29.c3)]);
    expect(ids29(g, 'p1', 'characters')).toEqual([SANJI]);
    expect(ids29(g, 'p1', 'trash')).toEqual([C29.c3]);
    expect(hand(g)).toEqual([C29.c2]);
    // [On Play]: the top card of the deck is a {Straw Hat Crew} card and is offered.
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SHC]);
  });

  it('declining the [Trigger] does not play Sanji: he goes to my hand and no card is trashed', () => {
    const g = hit([C29.c2]);
    declineTrigger(g);
    expect(ids29(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([C29.c2, SANJI].sort());
    expect(ids29(g, 'p1', 'trash')).toEqual([]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('with an empty hand the cost cannot be paid: Sanji is never played', () => {
    const g = hit([]);
    // The engine does not even offer to activate (nothing to trash); if it did, nothing would be played.
    if (g.legal().some((a) => a.type === 'trigger' && a.activate)) {
      activateTrigger(g);
      unusable(g, 'p1');
    } else {
      declineTrigger(g);
    }
    expect(ids29(g, 'p1', 'characters')).toEqual([]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('with the Character area full (5 Characters) the played Sanji forces a trash of one of them', () => {
    const five = [C29.c1, C29.c2, C29.c3, C29.c4, C29.c5];
    const g = theirs(
      L29.croc,
      {
        life: [SANJI, ...fill(C29.c1, 3)],
        hand: [C29.c6],
        characters: five,
        deck: [C29.c4, ...fill(C29.c1, 14)],
      },
      {},
    );
    hitLeader(g);
    activateTrigger(g);
    payCost29(g, [inst(g, 'p1', 'hand', C29.c6)]);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', C29.c1)]);
    expect(ids29(g, 'p1', 'characters')).toEqual([SANJI, C29.c2, C29.c3, C29.c4, C29.c5].sort());
    expect(ids29(g, 'p1', 'trash')).toContain(C29.c1);
  });
});
