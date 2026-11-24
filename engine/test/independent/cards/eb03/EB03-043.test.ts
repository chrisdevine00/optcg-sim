/**
 * EB03-043 Stussy (Character, Black, cost 7, 7000, no Counter, {CP0}).
 *
 * Card text: "[Blocker]
 * [On Play] You may place 2 cards with a type including "CP" from your trash at the bottom of your
 * deck in any order: K.O. up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: CR 8-3-1 (a "you may" cost is all or nothing), type "including" (substring match), CR
 * 4-8-1 ("up to"), CR 11-3 (placing at the bottom in any order: the owner picks the order).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  blockers,
  C14,
  canFinish,
  chars,
  deck,
  kind,
  LB,
  mine,
  mustBeUnpayable,
  need,
  offeredIds,
  outcomes,
  reachablePickSets,
  payHand,
  pickCards,
  put,
  settleOrders,
  tail,
  theirs,
  trash,
} from './kit-eb03b.ts';
import { attack } from '../../helpers.ts';

const ID = 'EB03-043';
const KUMADORI = 'OP03-082'; // {CP9}, cost 4, 6000, vanilla
const JERRY = 'OP03-084'; // {CP6}, cost 2, 4000, vanilla
const NERO = 'OP03-087'; // {CP9}, cost 3, 5000, vanilla
const MARCO = C14.marco; // cost 3, 5000, no CP type
const SAI = C14.sai; // cost 2
const HAJRUDIN = C14.hajrudin; // cost 4, 6000
const KINGDEW = C14.kingdew; // cost 5, 7000

function start(o: { trash?: string[]; p2?: string[]; deck?: string[] }) {
  return mine(
    LB.luffy,
    {
      hand: [ID],
      trash: o.trash ?? [KUMADORI, JERRY],
      ...(o.deck ? { deck: o.deck } : {}),
      costArea: { active: 10, rested: 0 },
    },
    { characters: o.p2 ?? [HAJRUDIN] },
  );
}

/** Play, accept the cost, pay it with these two trash cards. Leaves the order/target prompt pending. */
function pay(g: ReturnType<typeof start>, cards: [string, string] = [KUMADORI, JERRY]) {
  put(g, ID);
  answerMay(g, true);
  // With exactly two candidates in the trash the engine takes them itself (a forced pick).
  if (kind(g) === 'choose') payHand(g, cards);
}

describe('EB03-043 Stussy: [Blocker]; [On Play] place 2 "CP" cards from trash at the bottom of the deck: K.O. up to 1 Character of cost 4 or less', () => {
  it('pays 2 CP cards from the trash to the bottom of the deck and K.O.s a cost-4 Character', () => {
    const g = start({});
    const deckBefore = deck(g).length;
    pay(g);
    settleOrders(g);
    need(g, 'choose', 'p1');
    pickCards(g, [HAJRUDIN]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(deckBefore + 2);
    expect(tail(deck(g), 2).sort()).toEqual([JERRY, KUMADORI].sort());
    expect(chars(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([HAJRUDIN]);
  });

  it('the two cards go to the bottom in an order the owner chooses: both orders are reachable', () => {
    const g = start({});
    pay(g);
    const orders = outcomes(g, 'p1', (game) => deck(game).slice(-2).join('>'));
    expect(orders.size).toBeGreaterThanOrEqual(2);
    const bottoms = new Set([...orders].map((o) => o.split('>').sort().join('+')));
    expect(bottoms).toEqual(new Set([[JERRY, KUMADORI].sort().join('+')]));
  });

  it('the cost offers only cards with a type including "CP": a {CP9}, a {CP6} and a {CP0}; not other cards', () => {
    const g = start({ trash: [KUMADORI, JERRY, NERO, MARCO, SAI] });
    put(g, ID);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    const everything = new Set(
      [...reachablePickSets(g)].flatMap((x) => x.split('+')).filter(Boolean),
    );
    expect([...everything].sort()).toEqual([JERRY, KUMADORI, NERO].sort());
    for (const set of reachablePickSets(g))
      expect(set.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
  });

  it('with only one "CP" card in the trash the cost cannot be paid: nothing is placed, nothing K.O.\'d', () => {
    const g = start({ trash: [KUMADORI, MARCO, SAI] });
    const deckBefore = deck(g).length;
    put(g, ID);
    mustBeUnpayable(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([KUMADORI, MARCO, SAI].sort());
    expect(deck(g)).toHaveLength(deckBefore);
    expect(chars(g, 'p2')).toEqual([HAJRUDIN]);
  });

  it('declining the cost: nothing happens', () => {
    const g = start({});
    const deckBefore = deck(g).length;
    put(g, ID);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([JERRY, KUMADORI].sort());
    expect(deck(g)).toHaveLength(deckBefore);
    expect(chars(g, 'p2')).toEqual([HAJRUDIN]);
  });

  it("the K.O. offers the opponent's Characters with cost 4 or less: cost 4 yes, cost 5 no, my own no", () => {
    const g = mine(
      LB.luffy,
      {
        hand: [ID],
        trash: [KUMADORI, JERRY],
        characters: [SAI],
        costArea: { active: 10, rested: 0 },
      },
      { characters: [HAJRUDIN, KINGDEW, MARCO] },
    );
    pay(g);
    settleOrders(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJRUDIN, MARCO].sort());
  });

  it('"up to 1": may K.O. nothing, and the cards are placed anyway', () => {
    const g = start({});
    const deckBefore = deck(g).length;
    pay(g);
    settleOrders(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([HAJRUDIN]);
    expect(deck(g)).toHaveLength(deckBefore + 2);
  });

  it('with three CP cards in the trash exactly two are placed; the third stays', () => {
    const g = start({ trash: [KUMADORI, JERRY, NERO] });
    put(g, ID);
    answerMay(g, true);
    payHand(g, [KUMADORI, NERO]);
    settleOrders(g);
    if (kind(g) === 'choose') act(g, { type: 'done' });
    expect(trash(g)).toEqual([JERRY]);
    expect(tail(deck(g), 2).sort()).toEqual([KUMADORI, NERO].sort());
  });

  it("[Blocker]: it can block an attack on my Leader on the opponent's turn", () => {
    const g = theirs(LB.luffy, { characters: [ID] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });
});
