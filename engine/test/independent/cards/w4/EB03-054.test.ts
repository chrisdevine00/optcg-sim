/**
 * EB03-054 Nico Robin (Character, yellow, cost 3, 5000, {Straw Hat Crew}).
 *
 * Card text: "[On Play] You may trash 1 card from the top of your Life cards: Add up to 1 card from the
 * top of your deck to the top of your Life cards.
 * [Trigger] You may trash 1 card from your hand: Play this card."
 *
 * Rules: trashing a Life card by an effect is not damage and never activates a [Trigger] (RD 104,
 * RL-22). The "may" cost is paid first; the effect after the colon is "up to 1". A [Trigger] is
 * activated instead of adding the card to hand (CR 10-1-5-1); its cost is paid from the hand.
 */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import {
  act,
  at,
  BLUE,
  chars,
  decision,
  deck,
  fill,
  hand,
  hitLeader,
  kind,
  lifeCards,
  mine,
  need,
  no,
  playRaw,
  theirs,
  trash,
  unusable,
  W,
  LW,
  yes,
  payHandCard,
} from './kit-w4b.ts';

const ROBIN = 'EB03-054';
const RINDO = 'OP14-115';

/** p1's Main Phase with Robin in hand; Life top first; deck top first. */
function board(life: string[] = fill(BLUE, 4), deckTop: string[] = [W.sai]) {
  return mine(LW.croc, { hand: [ROBIN], life, deck: [...deckTop, ...fill(BLUE, 14)] }, {});
}

describe("EB03-054 Nico Robin: [On Play] trash the top Life card to add the deck's top card to Life", () => {
  it("paying the cost and adding: the old top Life card is in the trash, the deck's top card is the new top Life card, Life stays 4", () => {
    const g = board([W.marco, ...fill(BLUE, 3)], [W.sai]);
    playRaw(g, ROBIN);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([W.marco]);
    expect(lifeCards(g)[0]).toBe(W.sai);
    expect(lifeCards(g)).toEqual([W.sai, ...fill(BLUE, 3)]);
    expect(deck(g)).toHaveLength(14);
  });

  it('declining the "may" cost changes nothing', () => {
    const g = board();
    playRaw(g, ROBIN);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('paying the cost but adding nothing ("up to 1") leaves the Life one lower and the card in the trash', () => {
    const g = board([W.marco, ...fill(BLUE, 3)]);
    playRaw(g, ROBIN);
    yes(g, 'p1');
    need(g, 'optional', 'p1');
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toEqual([W.marco]);
    expect(deck(g)).toHaveLength(15);
  });

  it('adds at most 1 card: the deck loses exactly one', () => {
    const g = board(fill(BLUE, 4), [W.sai, W.marco]);
    playRaw(g, ROBIN);
    yes(g, 'p1');
    yes(g, 'p1');
    need(g, 'main', 'p1');
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(W.marco);
  });

  it('with 1 Life the cost is payable: Life 1 to 0 to 1', () => {
    const g = board([W.marco]);
    playRaw(g, ROBIN);
    yes(g, 'p1');
    yes(g, 'p1');
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(1);
    expect(lifeCards(g)).toEqual([W.sai]);
    expect(trash(g)).toEqual([W.marco]);
  });

  it('with 0 Life the cost cannot be paid: nothing happens', () => {
    const g = board([]);
    playRaw(g, ROBIN);
    unusable(g, 'p1');
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(0);
    expect(deck(g)).toHaveLength(15);
    expect(trash(g)).toEqual([]);
    expect(queries.result(g.state)).toBeNull();
  });

  it('trashing a Life card with a [Trigger] is not damage: no [Trigger] decision, the card is simply in the trash', () => {
    const g = mine(
      LW.hancock,
      { hand: [ROBIN], life: [RINDO, ...fill(BLUE, 3)], deck: [W.sai, ...fill(BLUE, 14)] },
      {},
    );
    playRaw(g, ROBIN);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([RINDO]);
    expect(chars(g)).toEqual([ROBIN]);
  });

  it('Robin herself is played and stays on the field regardless of the choices', () => {
    const g = board();
    playRaw(g, ROBIN);
    no(g, 'p1');
    expect(chars(g)).toEqual([ROBIN]);
    expect(g.power(at(g, 'p1', 'characters', ROBIN))).toBe(5000);
  });
});

describe('EB03-054 Nico Robin: [Trigger] trash 1 card from your hand to play this card', () => {
  /** p2's Leader hits p1's Leader; the top Life card is Robin; p1 holds `handCards`. */
  function hit(handCards: string[]) {
    const g = theirs(
      LW.croc,
      { hand: handCards, life: [ROBIN, ...fill(BLUE, 3)], deck: [W.sai, ...fill(BLUE, 14)] },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('activating pays 1 hand card (trashed) and plays Robin', () => {
    const g = hit([W.marco, W.sai]);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(decision(g)?.purpose).toBe('cost');
    payHandCard(g, g.find('p1', 'hand', W.marco));
    expect(chars(g)).toEqual([ROBIN]);
    expect(trash(g)).toEqual([W.marco]);
    expect(hand(g)).toEqual([W.sai]);
  });

  it('the played Robin\'s [On Play] then fires (it offers its own "use" question)', () => {
    const g = hit([W.marco]);
    act(g, { type: 'trigger', activate: true });
    payHandCard(g, g.find('p1', 'hand', W.marco));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    yes(g, 'p1');
    need(g, 'main', 'p2');
    // Life: 4 -1 (hit) = 3, then 3 -1 +1 = 3.
    expect(g.life('p1')).toBe(3);
    expect(lifeCards(g)[0]).toBe(W.sai);
  });

  it('declining the [Trigger] adds Robin to the hand and trashes nothing', () => {
    const g = hit([W.marco]);
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ROBIN, W.marco].sort());
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
  });

  it('with an empty hand the [Trigger] cannot be activated', () => {
    const g = hit([]);
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(false);
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ROBIN]);
  });
});
