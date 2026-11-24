/**
 * OP16-020 If You're Coming with Me... Kiss Your Lives Goodbye!! (Event, Red, cost 0, {The Four
 * Emperors}/{Whitebeard Pirates}).
 *
 * Card text: "[Main] You may rest 1 of your DON!! cards and reveal 1 Character card with 8000 power
 * from your hand: Draw 1 card.
 * [Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Character cards gains
 * +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (a cost needs all its parts), CR 11-2-1 (reveal), CR 7-1-3-1 (Counter Step),
 * "during this battle" ends with the battle (RL-08), "up to 1" (CR 8-4-4-1).
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  at,
  atMain,
  attack,
  BLUE,
  canCounterNow,
  charIds,
  choices,
  deck,
  describeEightKCost,
  don,
  fill,
  hand,
  kind,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  OL,
  OV,
  offeredIds,
  passBlock,
  payHand,
  pickInst,
  playCard,
  RED,
  side,
  theirTurn,
  trash,
  unusable,
  yes,
  n,
} from './kit-op16a.ts';

const EVENT = 'OP16-020';
const DECK = fill(RED, 6);

function playMain(extra: string[], costArea = { active: 10, rested: 0 }) {
  const g = mine(OL.ace, { hand: [EVENT, ...extra], deck: DECK, costArea });
  playCard(g, EVENT);
  return g;
}

describeEightKCost({
  id: EVENT,
  verb: 'reveal',
  trashBase: [EVENT],
  start: (extra) => playMain(extra),
  happened: (g) => n(g, 'p1', 'deck') < DECK.length,
});

describe('OP16-020 [Main] rest 1 DON!! and reveal an 8000 Character: draw 1', () => {
  it('paying rests exactly 1 DON!! (the Event costs 0) and draws exactly 1', () => {
    const g = playMain([OV.thatch]);
    yes(g);
    payHand(g, [OV.thatch]);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    expect(deck(g)).toHaveLength(DECK.length - 1);
    expect(hand(g)).toEqual([RED, OV.thatch].sort());
    expect(trash(g)).toEqual([EVENT]);
    expect(atMain(g)).toBe(true);
  });

  it('with no active DON!! (all 10 rested) the cost cannot be paid even with an 8000 Character in hand', () => {
    const g = playMain([OV.thatch], { active: 0, rested: 10 });
    unusable(g, 'p1');
    expect(deck(g)).toHaveLength(DECK.length);
    expect(hand(g)).toEqual([OV.thatch]);
  });

  it('with exactly 1 active DON!! the cost can be paid', () => {
    const g = playMain([OV.thatch], { active: 1, rested: 9 });
    yes(g);
    payHand(g, [OV.thatch]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 10 });
    expect(deck(g)).toHaveLength(DECK.length - 1);
  });

  it('declining rests no DON!! and draws nothing', () => {
    const g = playMain([OV.thatch]);
    no(g);
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0 });
    expect(deck(g)).toHaveLength(DECK.length);
  });
});

describe('OP16-020 [Counter] trash 1 card: +3000 power during this battle', () => {
  /** p2's Leader (5000) attacks my Leader (5000); I hold the Event, `inHand` and `chars`. */
  function counterStep(inHand: string[], chars: string[] = [OV.sai4]) {
    const g = theirTurn(
      side(OL.ace, BLUE, { hand: [EVENT, ...inHand], characters: chars, life: fill(BLUE, 4) }),
      side(OL.luffy, RED, { characters: [OV.hajrudin6] }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }
  const useIt = (g: ReturnType<typeof counterStep>, trashCard: string) => {
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    payHand(g, [trashCard]);
  };

  it('can be activated in the Counter Step', () => {
    const g = counterStep([OV.thatch]);
    expect(canCounterNow(g, g.find('p1', 'hand', EVENT))).toBe(true);
  });

  it('trashing a card gives my Leader +3000 (8000) and the attack no longer connects', () => {
    const g = counterStep([OV.thatch]);
    useIt(g, OV.thatch);
    need(g, 'choose');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([EVENT, OV.thatch].sort());
  });

  it('the +3000 may go to one of my Characters instead', () => {
    const g = counterStep([OV.thatch]);
    useIt(g, OV.thatch);
    pickInst(g, [at(g, 'p1', 'characters', OV.sai4)]);
    expect(g.power(at(g, 'p1', 'characters', OV.sai4))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('targets are only my Leader and Characters, not the opponent\'s', () => {
    const g = counterStep([OV.thatch]);
    useIt(g, OV.thatch);
    need(g, 'choose');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([OV.sai4, OL.ace].sort());
  });

  it('"up to 1": may choose nothing; the card stays trashed', () => {
    const g = counterStep([OV.thatch]);
    useIt(g, OV.thatch);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([EVENT, OV.thatch].sort());
  });

  it('any card from hand pays (here a 1000-cost Komachiyo, not only Characters with 8000)', () => {
    const g = counterStep([OV.komachiyo3, OV.thatch]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.komachiyo3, OV.thatch].sort());
  });

  it('with no other card in hand the cost cannot be paid (the Event itself is being played)', () => {
    const g = counterStep([]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the cost gives no boost and the attack connects', () => {
    const g = counterStep([OV.thatch]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    no(g);
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([OV.thatch]);
  });

  it('"during this battle": the +3000 is gone after the battle', () => {
    const g = counterStep([OV.thatch]);
    useIt(g, OV.thatch);
    pickInst(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(charIds(g, 'p1')).toEqual([OV.sai4]);
  });
});
