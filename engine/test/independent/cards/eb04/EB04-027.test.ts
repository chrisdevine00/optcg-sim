/**
 * EB04-027 Boa Hancock (Character, cost 5, 7000, no Counter, {Kuja Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[On Play] Draw 2 cards and trash 1 card from your hand.
 * [Trigger] Play up to 1 Character card with 5000 power or less and a [Trigger] from your hand."
 *
 * Rules: [On Play] is automatic: draw 2, then trash 1 card of my choice; [Trigger] may be activated or
 * not (CR 10-1-5) and then the card is trashed (or added to hand when declined); "up to 1"
 * (CR 8-4-4-1); the card played must be a Character card in hand with power <= 5000 AND a [Trigger].
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  cardIds,
  choices,
  hand,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  SN,
  theirs,
  trash,
} from './kit-eb04a.ts';

const HANCOCK = 'EB04-027';
const DECK = [SN.c3, SN.c4, SN.c5, SN.c6, SN.c7];

describe('EB04-027 Boa Hancock [On Play]: draw 2 cards and trash 1 card from your hand', () => {
  it('printed values: cost 5, 7000, no Counter', () => {
    const g = mine(LE.luffy, { hand: [HANCOCK] }, {});
    const c = g.card(g.find('p1', 'hand', HANCOCK));
    expect(c.cost).toBe(5);
    expect(c.power).toBe(7000);
    expect(c.counter).toBeNull();
  });

  it('draws the top 2 cards, then I choose 1 card of my hand to trash', () => {
    const g = mine(LE.luffy, { hand: [HANCOCK, SN.c1], deck: DECK }, {});
    playRaw(g, HANCOCK);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([SN.c1, DECK[0], DECK[1]].sort());
    need(g, 'choose');
    act(g, { type: 'pick', choice: choices(g).find((i) => g.card(i).card === SN.c1)! });
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([DECK[0], DECK[1]].sort());
    expect(trash(g)).toEqual([SN.c1]);
    expect(cardIds(g, 'p1', 'deck')).toEqual(DECK.slice(2));
  });

  it('a card just drawn may be the one trashed', () => {
    const g = mine(LE.luffy, { hand: [HANCOCK, SN.c1], deck: DECK }, {});
    playRaw(g, HANCOCK);
    act(g, { type: 'pick', choice: choices(g).find((i) => g.card(i).card === DECK[1])! });
    expect(hand(g)).toEqual([SN.c1, DECK[0]].sort());
    expect(trash(g)).toEqual([DECK[1]]);
  });

  it('a hand empty before the draw: draws 2, trashes 1, so 1 card remains', () => {
    const g = mine(LE.luffy, { hand: [HANCOCK], deck: DECK }, {});
    playRaw(g, HANCOCK);
    need(g, 'choose');
    act(g, { type: 'pick', choice: choices(g)[0]! });
    expect(hand(g)).toHaveLength(1);
    expect(trash(g)).toHaveLength(1);
  });
});

describe('EB04-027 Boa Hancock [Trigger]: play up to 1 Character with 5000 power or less and a [Trigger] from hand', () => {
  /** p2's Leader hits p1's Leader; the top Life card is Hancock. Stops at the [Trigger] decision. */
  function hit(myHand: string[]) {
    const g = theirs(
      LE.luffy,
      { life: [HANCOCK, BLUE, BLUE, BLUE], hand: myHand },
      { characters: [SN.c4] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }
  const board = (g: ReturnType<typeof hit>) => cardIds(g, 'p1', 'characters');

  it('activating it plays the chosen Character (power 3000, has a [Trigger]); Hancock is trashed', () => {
    const g = hit([SN.speed, SN.c3]);
    need(g, 'trigger');
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose');
    pickInst(g, [choices(g).find((i) => g.card(i).card === SN.speed)!]);
    expect(board(g)).toEqual([SN.speed]);
    expect(hand(g)).toEqual([SN.c3]);
    expect(trash(g)).toEqual([HANCOCK]);
    expect(g.life('p1')).toBe(3);
  });

  it('boundary: a Character with exactly 5000 power and a [Trigger] (Kingbaum) is offered; 6000 with a [Trigger] is not; 5000 without a [Trigger] is not', () => {
    const g = hit([SN.kingbaum, SN.zoroTrig, SN.c3, SN.speed]);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.kingbaum, SN.speed].sort());
    expect(mayChooseNone(g)).toBe(true);
    none(g);
  });

  it('"up to 1": may play nothing; the hand is untouched', () => {
    const g = hit([SN.speed]);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose');
    none(g);
    expect(board(g)).toEqual([]);
    expect(hand(g)).toEqual([SN.speed]);
  });

  it('declining the [Trigger]: Hancock goes to hand and nothing is played', () => {
    const g = hit([SN.speed]);
    need(g, 'trigger');
    act(g, { type: 'trigger', activate: false });
    expect(hand(g).sort()).toEqual([HANCOCK, SN.speed].sort());
    expect(board(g)).toEqual([]);
  });

  it('no valid Character in hand (only a 6000 [Trigger] one): nothing can be played', () => {
    const g = hit([SN.zoroTrig, SN.c3]);
    act(g, { type: 'trigger', activate: true });
    // An "up to" pick over the hand with a filter is asked even when nothing matches (no hidden-card leak).
    need(g, 'choose');
    expect(choices(g)).toEqual([]);
    none(g);
    expect(board(g)).toEqual([]);
    expect(hand(g).sort()).toEqual([SN.c3, SN.zoroTrig].sort());
  });

  it('an empty hand: the pick is still asked (nothing to choose) and nothing is played', () => {
    const g = hit([]);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose');
    expect(choices(g)).toEqual([]);
    none(g);
    expect(board(g)).toEqual([]);
  });
});
