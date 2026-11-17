/**
 * OP15-118 Enel (Character, Purple, cost 6, 8000, {Sky Island}).
 *
 * Card text:
 *   "If you have 6 or less DON!! cards on your field, this Character cannot be removed from the
 *    field by your opponent's effects and gains +2000 power.
 *    [On Play] DON!! −1: Look at 5 cards from the top of your deck and add up to 1 card to your
 *    hand. Then, place the rest at the bottom of your deck in any order, and trash 1 card from
 *    your hand."
 *
 * Rules: CR 8-1-3-3 (permanent, re-checked continuously); "removed from the field" covers K.O. by
 * an effect but NOT losing a battle (CR 7-1-4-1-2: battle K.O. is not an effect); RL-24 (DON!! on
 * the field includes given and rested DON!!); CR 4-10-2 ("then" still resolves); CR 8-3-1-6;
 * CR 8-4-4-4 / 8-4-4-2.
 */
import { describe, expect, it } from 'vitest';
import { act, noDefence, attack } from '../../helpers.ts';
import { donOf, kind, myTurn, theirTurn } from '../kit.ts';
import {
  C,
  deckCards,
  deckOf,
  drive,
  FILLER,
  fieldDon,
  ids,
  offeredCards,
  playCard,
  side,
  sorted,
  V,
} from './kit-c.ts';

const ID = 'OP15-118';

describe('OP15-118 Enel: 6 or less DON!! → +2000 power and cannot be removed by opponent effects', () => {
  function board(costActive: number, p2: Parameters<typeof side>[2] = {}, rested = false) {
    return theirTurn(
      side(C.shanks, FILLER, {
        characters: [{ card: ID, rested }],
        costArea: { active: costActive, rested: 0 },
      }),
      side(C.luffy, FILLER, { costArea: { active: 6, rested: 0 }, ...p2 }),
    );
  }

  it('power 10000 with 6 DON!! on the field (boundary), 8000 with 7', () => {
    const g6 = board(6);
    expect(g6.power(g6.find('p1', 'characters', ID))).toBe(10000);
    const g7 = board(7);
    expect(g7.power(g7.find('p1', 'characters', ID))).toBe(8000);
  });

  it('given DON!! count as "on your field": 5 in the cost area + 2 given = 7 → 8000 (on the opponent\'s turn given DON!! add no power)', () => {
    const g = theirTurn(
      side(C.shanks, FILLER, {
        characters: [{ card: ID, don: 2 }],
        costArea: { active: 5, rested: 0 },
      }),
      side(C.luffy, FILLER),
    );
    expect(fieldDon(g, 'p1')).toBe(7);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(8000);
  });

  /**
   * The opponent's removal effect: OP17-098 Kong Gun, "K.O. up to 2 of your opponent's
   * Characters with a cost of 6 or less" (Enel's cost is 6).
   */
  function snakeKo(costActive: number, victim: string) {
    // p2 plays OP17-098 Gum-Gum Kong Gun (K.O. up to 2 Characters with cost 6 or less, needs a
    // Character with cost 12+ in play: p2's own OP17-089 Saul).
    const g = theirTurn(
      side(C.shanks, FILLER, {
        characters: [ID, V.sai],
        costArea: { active: costActive, rested: 0 },
      }),
      side(C.luffy, FILLER, {
        characters: [C.saul],
        hand: [C.elbaphEvent],
        costArea: { active: 7, rested: 0 },
      }),
    );
    playCard(g, 'p2', C.elbaphEvent);
    drive(g, 'p2', { targets: [g.find('p1', 'characters', victim)], don: 'costActive' });
    return g;
  }

  it("with 6 or less DON!! an opponent's K.O. effect cannot remove it (it stays on the field)", () => {
    const g = snakeKo(6, ID);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
    expect(sorted(ids(g, 'p1', 'characters'))).toEqual(sorted([ID, V.sai]));
  });

  it('with 7 DON!! on the field the same K.O. effect removes it', () => {
    const g = snakeKo(7, ID);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('losing a battle is not an effect: a 10000 attacker K.O.s a rested 10000 Enel (attacker wins ties)', () => {
    const g = board(6, { characters: [V.shiki8] }, true);
    attack(g, g.find('p2', 'characters', V.shiki8), g.find('p1', 'characters', ID));
    noDefence(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('Enel does not protect other Characters: the K.O. effect takes a rested Sai', () => {
    const g = snakeKo(6, V.sai);
    expect(ids(g, 'p1', 'trash')).toEqual([V.sai]);
    expect(ids(g, 'p1', 'characters')).toContain(ID);
  });
});

describe('OP15-118 Enel: [On Play] DON!! −1 → look at 5, add up to 1, rest to the bottom, trash 1 from hand', () => {
  const TOP5 = [V.sai, V.marco, V.hajrudin, V.kingdew, V.thatch];
  function game(hand: string[] = [V.sunny]) {
    return myTurn(
      side(C.shanks, FILLER, {
        hand: [ID, ...hand],
        costArea: { active: 6, rested: 0 },
        deck: deckOf([...TOP5, V.littleOars]),
      }),
      side(C.luffy, FILLER),
    );
  }

  it('happy path: adds the chosen card, the other 4 go to the bottom, then 1 card is trashed from hand', () => {
    const g = game();
    const pick = g.find('p1', 'deck', V.hajrudin);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [pick, g.find('p1', 'hand', V.sunny)], don: 'costRested' });
    expect(ids(g, 'p1', 'hand')).toEqual([V.hajrudin]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.sunny]);
    const deck = deckCards(g, 'p1');
    expect(deck[0]).toBe(V.littleOars);
    expect(sorted(deck.slice(-4))).toEqual(sorted([V.sai, V.marco, V.kingdew, V.thatch]));
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it('the trash step takes any card in hand, including the one just added', () => {
    const g = game();
    const pick = g.find('p1', 'deck', V.hajrudin);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [pick, pick], don: 'costRested' });
    // Whatever was trashed, exactly one card left the hand.
    expect(ids(g, 'p1', 'hand')).toHaveLength(1);
    expect(ids(g, 'p1', 'trash')).toHaveLength(1);
  });

  it('only the top 5 can be chosen (the 6th card is not offered)', () => {
    const g = game();
    playCard(g, 'p1', ID);
    for (let i = 0; i < 4 && kind(g) !== 'choose'; i++) drive(g, 'p1', { don: 'costRested' }, 1);
    // Skip the DON!! cost picks, if any.
    for (let i = 0; i < 3 && kind(g) === 'choose' && offeredCards(g).length === 0; i++) {
      g.act(g.legal().find((a) => a.type === 'pick')!);
    }
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted(TOP5));
  });

  it('"up to 1": adding nothing still trashes 1 card from hand (CR 4-10-2) and all 5 go to the bottom', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', V.sunny)], don: 'costRested' });
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.sunny]);
    const deck = deckCards(g, 'p1');
    expect(deck[0]).toBe(V.littleOars);
    expect(sorted(deck.slice(-5))).toEqual(sorted(TOP5));
  });

  it('CR 8-3-1-4: declining DON!! −1 does nothing: nothing added, nothing trashed, deck untouched', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(ids(g, 'p1', 'hand')).toEqual([V.sunny]);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
    expect(deckCards(g, 'p1')[0]).toBe(V.sai);
    act(g, { type: 'endTurn' });
  });
});
