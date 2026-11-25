/**
 * OP09-106 Nico Olvia (Character, Yellow, cost 1, 0 power, Counter +2000, {Ohara}, Wisdom).
 *
 * Card text: "[On Play] Up to 1 of your [Nico Robin] Leader gains +3000 power during this turn.
 * [Trigger] If your Leader is [Nico Robin], draw 3 cards and trash 2 cards from your hand."
 *
 * Rules: "[Nico Robin]" is an exact card name. "Up to 1" may be 0. "During this turn" ends in the End
 * Phase (CR 6-6-1-3). A "Then"-like second clause after a failed "If" does not resolve (CR 8-3-3): a
 * Leader that is not [Nico Robin] draws and trashes nothing. A [Trigger] card is trashed after it
 * resolves (CR 10-1-5-3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  atMain,
  deck,
  endTurn,
  hand,
  kind,
  LD9,
  mayEnd,
  mine,
  need,
  none,
  offeredInsts,
  pickCards,
  pickInst,
  playRaw,
  SC9,
  trash,
  triggerGame,
} from './kit-op09c.ts';

const OLVIA = 'OP09-106';
const DECK = [SC9.c8, SC9.c7, SC9.c6, SC9.c5, SC9.c4];

function viaPlay(leader: string = LD9.robin) {
  const g = mine(leader, { hand: [OLVIA], deck: DECK }, {});
  playRaw(g, OLVIA);
  return g;
}

function viaTrigger(leader: string = LD9.robin, handCards: string[] = [SC9.c1]) {
  return triggerGame(OLVIA, { leader, hand: handCards, deck: DECK });
}

describe('OP09-106 Nico Olvia: [On Play] my [Nico Robin] Leader +3000; [Trigger] draw 3, trash 2', () => {
  it('printed values: cost 1, 0 power, Counter +2000', () => {
    const g = viaPlay();
    const c = g.zone('p1', 'characters')[0]!;
    expect(c.cost).toBe(1);
    expect(c.power).toBe(0);
    expect(c.counter).toBe(2000);
  });

  it('[On Play] offers my [Nico Robin] Leader; choosing it gives +3000 power', () => {
    const g = viaPlay();
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p1')]);
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('the second [Nico Robin] Leader (EB05-010) is a valid target too', () => {
    const g = viaPlay(LD9.robin2);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('"up to 1": the boost may be declined', () => {
    const g = viaPlay();
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader that is not [Nico Robin] cannot be chosen: no power is given', () => {
    const g = viaPlay(LD9.luffy);
    if (kind(g) === 'choose') {
      expect(offeredInsts(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only the Leader: Olvia herself and my other Characters are not offered or boosted', () => {
    const g = mine(LD9.robin, { hand: [OLVIA], characters: [SC9.c4], deck: DECK }, {});
    playRaw(g, OLVIA);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([g.leader('p1')]);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.find('p1', 'characters', SC9.c4))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', OLVIA))).toBe(0);
  });

  it("the +3000 lasts this turn only: it is gone on the opponent's turn", () => {
    const g = viaPlay();
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("the opponent's Leader is never boosted", () => {
    const g = viaPlay();
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('[Trigger] with a [Nico Robin] Leader: draw 3 cards, then trash 2 cards from my hand', () => {
    const g = viaTrigger();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SC9.c1, SC9.c8]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC9.c7, SC9.c6].sort());
    expect(trash(g)).toEqual([OLVIA, SC9.c1, SC9.c8].sort());
    expect(deck(g)).toHaveLength(DECK.length - 3);
  });

  it('the net effect is +1 card: 1 in hand, +3 drawn, -2 trashed', () => {
    const g = viaTrigger();
    activateTrigger(g);
    pickCards(g, [SC9.c8, SC9.c7]);
    expect(hand(g)).toHaveLength(2);
  });

  it('[Trigger] with a Leader that is not [Nico Robin]: nothing is drawn or trashed, the card is trashed', () => {
    const g = viaTrigger(LD9.luffy);
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC9.c1]);
    expect(deck(g)).toHaveLength(DECK.length);
    expect(trash(g)).toEqual([OLVIA]);
  });

  it('declining the [Trigger]: Olvia goes to my hand and nothing is drawn', () => {
    const g = viaTrigger();
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([SC9.c1, OLVIA].sort());
    expect(deck(g)).toHaveLength(DECK.length);
  });
});
