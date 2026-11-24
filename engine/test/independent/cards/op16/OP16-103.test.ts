/**
 * OP16-103 Van Augur (Character, Yellow, cost 1, 2000, Counter +1000, {Blackbeard Pirates}).
 *
 * Card text: "[Opponent's Turn] [On K.O.] If your Leader has the {Blackbeard Pirates} type, draw 1 card
 * and give up to 1 of your opponent's Leader or Character cards −3000 power during this turn.
 * [Trigger] Activate this card's [On K.O.] effect."
 *
 * Rules: CR 10-2-1 ([On K.O.]), CR 10-2-12 ([Opponent's Turn]), CR 1-3-6-1 (power may go negative),
 * CR 6-6-1-3 ("during this turn"), RD 122 (a failed "If" ends the effect), RD 101-102 ([Trigger]).
 * The Leader used is OP16-080 Teach ({Blackbeard Pirates}); its own [On your Opponent's Attack]
 * needs a [Trigger] card in hand, which these hands never hold.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  act,
  at,
  atMain,
  attack,
  kind,
  mine,
  passBlock,
  payHand,
  BLUE,
  cardIds,
  choices,
  declineTrigger,
  deckOf,
  hand,
  hitLeader,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  SCN,
  theirs,
  theyKo,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-103';

function koed(o: { leader?: string; opp?: string[] } = {}) {
  const g = theirs(
    o.leader ?? LD16.teach,
    { characters: [{ card: ID, rested: true }], deck: deckOf([SCN.c1]) },
    { characters: o.opp ?? [SCN.c5] },
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe("OP16-103 Van Augur: [Opponent's Turn] [On K.O.] draw 1 and give an opposing Leader or Character -3000 this turn", () => {
  it("K.O.'d on the opponent's turn: draws 1 and the chosen opposing Leader gets -3000 (5000 -> 2000)", () => {
    const g = koed();
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p2')]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SCN.c1]);
    expect(g.power(g.leader('p2'))).toBe(2000);
    expect(trash(g)).toEqual([ID]);
  });

  it('the -3000 may go to an opposing Character instead (7000 -> 4000)', () => {
    const g = koed();
    pickCards(g, [SCN.c5]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c5))).toBe(4000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it("candidates: the opponent's Leader and Characters only (my own Leader is not offered)", () => {
    const g = koed();
    expect(offeredIds(g)).toEqual([SCN.c5, LD16.plain].sort());
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": may give the penalty to nobody; the card is still drawn', () => {
    const g = koed();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([SCN.c1]);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('only one target is penalised', () => {
    const g = koed();
    pickCards(g, [SCN.c5]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('power may go below 0: a 3000 Character at -3000 is at 0 or lower', () => {
    const g = koed({ opp: [SCN.c1] });
    pickCards(g, [SCN.c1]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c1))).toBeLessThanOrEqual(0);
  });

  it('condition: with a Leader that is not {Blackbeard Pirates} nothing is drawn and no one is penalised', () => {
    const g = koed({ leader: LD16.wano });
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(trash(g)).toEqual([ID]);
  });

  it("the penalty lasts through the opponent's turn only: it is gone on my next turn", () => {
    const g = koed();
    pickInst(g, [g.leader('p2')]);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('[Trigger]: activating it from Life runs the [On K.O.] effect and trashes Van Augur', () => {
    const g = theirs(
      LD16.teach,
      { life: [ID, BLUE, BLUE, BLUE], deck: deckOf([SCN.c1]) },
      { characters: [SCN.c5] },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    pickCards(g, [SCN.c5]);
    expect(hand(g)).toEqual([SCN.c1]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c5))).toBe(4000);
    expect(trash(g)).toEqual([ID]);
  });

  it('[Trigger] declined: Van Augur goes to my hand, no draw, no penalty', () => {
    const g = theirs(
      LD16.teach,
      { life: [ID, BLUE, BLUE, BLUE], deck: deckOf([SCN.c1]) },
      { characters: [SCN.c5] },
    );
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c5))).toBe(7000);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it("timing: K.O.'d during MY OWN turn (by the opponent's Caribou [Trigger]) the [Opponent's Turn] effect does not happen", () => {
    // p1 attacks p2's Leader; p2's top Life card is OP17-101 Caribou: [Trigger] "You may trash 1 card
    // from your hand: K.O. up to 1 of your opponent's Characters with a cost of 5 or less".
    const g = mine(
      LD16.teach,
      { characters: [ID, SCN.c4], deck: deckOf([SCN.c1]) },
      { life: ['OP17-101', BLUE, BLUE, BLUE], hand: [BLUE], characters: [SCN.c5] },
    );
    attack(g, at(g, 'p1', 'characters', SCN.c4), g.leader('p2'));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p2');
    activateTrigger(g);
    payHand(g, [BLUE]);
    pickCards(g, [ID]);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p1')).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(at(g, 'p2', 'characters', SCN.c5))).toBe(7000);
  });
});
