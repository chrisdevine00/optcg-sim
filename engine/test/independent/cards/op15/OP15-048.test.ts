/**
 * OP15-048 Chinjao (Character, Blue, cost 4, 5000, Counter +1000, {Happosui Army}/{Dressrosa}).
 *
 * Card text: "[On Play] You may trash 1 Event from your hand: Draw 2 cards.
 * [Opponent's Turn] [On K.O.] Your opponent places 1 card from their hand at the bottom of their deck."
 *
 * Rules: CR 8-3-1-3 / 8-3-1-4 (a "may" cost can be skipped, an unpayable one cannot be paid), CR 4-5-3
 * (draw X), CR 10-2-12-1 ([Opponent's Turn] is a condition on the effect), CR 10-2-17 / RD 110
 * ([On K.O.] after a K.O. in battle or by an effect).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  answerMay,
  activateTrigger,
  atMain,
  BLUE,
  choices,
  deck,
  hand,
  inst,
  kind,
  LD15,
  mine,
  mustBeUnpayable,
  noDefenceUntilTrigger,
  need,
  offeredIds,
  opponentKOs,
  payHand,
  pickInst,
  playRaw,
  RED,
  SCN,
  side,
  theirTurn,
  trash,
  yes,
  no,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const CHINJAO = 'OP15-048';
/** ST01-014 Guard Point: Red Event, cost 1. */
const EVENT = 'ST01-014';
/** OP17-056 Rocks Pirates: blue Event, cost 0. */
const EVENT2 = 'OP17-056';
/** OP09-077 Gum-Gum Lightning: Event, DON!! -2, K.O. up to 1 Character with 6000 power or less. */
const LIGHTNING = 'OP09-077';
/** OP15-115 Impact Dial: yellow Event, "[Trigger] K.O. up to 1 of your opponent's Characters with a cost of 4 or less." */
const IMPACT_DIAL = 'OP15-115';

const TOP = [SCN.c7, SCN.c8, SCN.c6, ...Array.from({ length: 10 }, () => BLUE)];

function start(handCards: string[]): TestGame {
  return mine(LD15.shc, { hand: [CHINJAO, ...handCards], deck: TOP });
}

/** p2's turn: p2's 6000 Character attacks p1's rested Chinjao (5000) and K.O.s it. */
function koInBattle(p2hand: string[]): TestGame {
  const g = theirTurn(
    side(LD15.shc, BLUE, { characters: [{ card: CHINJAO, rested: true }] }),
    side(LD15.neutral, RED, {
      costArea: { active: 10, rested: 0 },
      characters: [SCN.c4],
      hand: p2hand,
      deck: Array.from({ length: 12 }, () => SCN.c1),
    }),
  );
  attack(g, inst(g, 'p2', 'characters', SCN.c4), inst(g, 'p1', 'characters', CHINJAO));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('OP15-048 Chinjao: [On Play] may trash 1 Event: draw 2; [Opponent’s Turn][On K.O.] opponent bottoms 1 hand card', () => {
  it('[On Play]: trashing an Event from hand draws 2 cards', () => {
    const g = start([EVENT, BLUE]);
    playRaw(g, CHINJAO);
    answerMay(g, true);
    payHand(g, [EVENT]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([EVENT]);
    expect(hand(g)).toEqual([BLUE, SCN.c7, SCN.c8].sort());
    expect(deck(g)[0]).toBe(SCN.c6);
  });

  it('declining the cost: nothing is trashed and nothing is drawn', () => {
    const g = start([EVENT]);
    playRaw(g, CHINJAO);
    need(g, 'optional', 'p1');
    no(g);
    expect(hand(g)).toEqual([EVENT]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
  });

  it('only Events are candidates for the cost (Characters in hand are not offered)', () => {
    const g = start([EVENT, EVENT2, BLUE, SCN.c3]);
    playRaw(g, CHINJAO);
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).every((c) => c === EVENT || c === EVENT2)).toBe(true);
    expect(choices(g).length).toBeGreaterThanOrEqual(1);
    expect(offeredIds(g)).not.toContain(BLUE);
    expect(offeredIds(g)).not.toContain(SCN.c3);
  });

  it('CR 8-3-1-3: with no Event in hand the cost cannot be paid and nothing is drawn', () => {
    const g = start([BLUE, SCN.c3]);
    playRaw(g, CHINJAO);
    mustBeUnpayable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([BLUE, SCN.c3].sort());
    expect(deck(g)).toHaveLength(13);
    expect(trash(g)).toEqual([]);
  });

  it('exactly 1 Event is trashed even with two in hand, and exactly 2 cards are drawn', () => {
    const g = start([EVENT, EVENT2]);
    playRaw(g, CHINJAO);
    yes(g);
    payHand(g, [EVENT2]);
    expect(trash(g)).toEqual([EVENT2]);
    expect(hand(g)).toEqual([EVENT, SCN.c7, SCN.c8].sort());
    expect(deck(g)).toHaveLength(11);
  });

  it('the trashed Event is not played: its effect does not happen', () => {
    const g = start([LIGHTNING]);
    playRaw(g, CHINJAO);
    yes(g);
    payHand(g, [LIGHTNING]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([LIGHTNING]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.life('p1')).toBe(4);
  });

  it('[On K.O.] on the opponent’s turn: the opponent places 1 card from their hand at the bottom of their deck', () => {
    const g = koInBattle([SCN.c2, SCN.c3, SCN.c5]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([CHINJAO]);
    need(g, 'choose', 'p2');
    const pick = inst(g, 'p2', 'hand', SCN.c3);
    expect(choices(g)).toContain(pick);
    g.act({ type: 'pick', choice: pick });
    if (kind(g) === 'choose') g.act({ type: 'done' });
    expect(hand(g, 'p2')).toEqual([SCN.c2, SCN.c5].sort());
    const d2 = deck(g, 'p2');
    expect(d2).toHaveLength(13);
    expect(d2[d2.length - 1]).toBe(SCN.c3);
  });

  it('the opponent chooses the card, not me: their whole hand is offered to them', () => {
    const g = koInBattle([SCN.c2, SCN.c3, SCN.c5]);
    need(g, 'choose', 'p2');
    expect(choices(g)).toHaveLength(3);
  });

  it('with an empty opponent hand nothing happens and the game moves on', () => {
    const g = koInBattle([]);
    expect(deck(g, 'p2')).toHaveLength(12);
    expect(hand(g, 'p2')).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('with exactly 1 card in the opponent’s hand it goes to the bottom', () => {
    const g = koInBattle([SCN.c5]);
    if (kind(g) === 'choose') g.act({ type: 'pick', choice: inst(g, 'p2', 'hand', SCN.c5) });
    expect(hand(g, 'p2')).toEqual([]);
    const d2 = deck(g, 'p2');
    expect(d2[d2.length - 1]).toBe(SCN.c5);
  });

  it('[Opponent’s Turn] also covers a K.O. by an effect on the opponent’s turn', () => {
    const g = theirTurn(
      side(LD15.shc, BLUE, { characters: [CHINJAO] }),
      side(LD15.neutral, RED, {
        costArea: { active: 10, rested: 0 },
        hand: [LIGHTNING, SCN.c2, SCN.c3],
        deck: Array.from({ length: 12 }, () => SCN.c1),
      }),
    );
    opponentKOs(g, inst(g, 'p1', 'characters', CHINJAO));
    need(g, 'choose', 'p2');
    expect(choices(g)).toHaveLength(2);
  });

  it('must not: Chinjao K.O.\u2019d on my own turn makes the opponent place nothing', () => {
    const g = mine(
      LD15.shc,
      { characters: [CHINJAO] },
      {
        life: [IMPACT_DIAL, BLUE, BLUE, BLUE],
        hand: [SCN.c2, SCN.c3],
        deck: Array.from({ length: 12 }, () => SCN.c1),
      },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefenceUntilTrigger(g);
    need(g, 'trigger', 'p2');
    activateTrigger(g);
    need(g, 'choose', 'p2');
    pickInst(g, [inst(g, 'p1', 'characters', CHINJAO)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([CHINJAO]);
    expect(hand(g, 'p2')).toEqual([SCN.c2, SCN.c3].sort());
    expect(deck(g, 'p2')).toHaveLength(12);
  });
});
