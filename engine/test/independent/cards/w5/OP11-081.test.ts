/**
 * OP11-081 Cognac Mama-Mash (Event, Purple, cost 6, {The Four Emperors}/{Big Mom Pirates}).
 *
 * Card text: "[Main] Choose a cost and reveal 1 card from the top of your opponent's deck. If the
 * revealed card has the chosen cost, K.O. up to 1 of your opponent's Characters with a base cost of
 * 8 or less." "[Trigger] Add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: "choose a cost" is a number named before the reveal (M6b-Q67); "up to 1" may be skipped; an
 * Event is trashed after its [Main] resolves; an activated [Trigger] resolves before the Life card
 * goes to the trash (CR 10-1-5-1 style flow), and a declined one sends the card to the hand.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  chars,
  chooseCost,
  COST,
  declineTrigger,
  deck,
  deckWith,
  don,
  hand,
  hasEvent,
  hitLeader,
  kind,
  LW,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  takeMost,
  theirs,
  trash,
  lifeCards,
  askingCost,
  V13,
  type Spec,
} from './kit-w5b.ts';

const MAMA = 'OP11-081';

function board(top: string, p2chars: string[], over: Spec = {}) {
  return mine(
    LW.luffy,
    { hand: [MAMA], costArea: { active: 6, rested: 0 }, ...over },
    { deck: deckWith(top), characters: p2chars },
  );
}

function fire(g: ReturnType<typeof board>, n: number) {
  playRaw(g, MAMA);
  chooseCost(g, n);
}

/** p2 attacks p1's Leader; p1's top Life card is Cognac Mama-Mash. */
function underAttack(full = false) {
  return theirs(
    LW.luffy,
    {
      life: [MAMA, V13.mohji, V13.mohji, V13.mohji],
      costArea: { active: full ? 10 : 0, rested: 0 },
    },
    {},
  );
}

describe('OP11-081 Cognac Mama-Mash: [Main] choose a cost, K.O. a base cost 8 or less; [Trigger] add active DON!!', () => {
  it('printed values: an Event with cost 6', () => {
    const g = board(COST.c3, []);
    const c = g.card(at(g, 'p1', 'hand', MAMA));
    expect(c.cost).toBe(6);
  });

  it('cannot be played with 5 active DON!! (cost 6)', () => {
    const g = board(COST.c3, [], { costArea: { active: 5, rested: 0 } });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === at(g, 'p1', 'hand', MAMA)),
    ).toBe(false);
  });

  it('playing it asks for a cost and reveals nothing until a number is named', () => {
    const g = board(COST.c3, [COST.c2]);
    playRaw(g, MAMA);
    expect(askingCost(g)).toBe(true);
    // The Event itself is shown as it is played; the opponent's deck top is not.
    expect(hasEvent(g, 'CardRevealed', { card: COST.c3 })).toBe(false);
  });

  it('a match K.O.s the picked Character; the Event goes to the trash and the 6 DON!! stay rested', () => {
    const g = board(COST.c3, [COST.c2, COST.c5]);
    fire(g, 3);
    need(g, 'choose', 'p1');
    pickCards(g, [COST.c2]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([COST.c5]);
    expect(trash(g)).toEqual([MAMA]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 6 });
  });

  it('boundary: base cost 8 is offered, base cost 9 is not', () => {
    const g = board(COST.c3, [COST.c8, COST.c9]);
    fire(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST.c8]);
    pickCards(g, [COST.c8]);
    expect(chars(g, 'p2')).toEqual([COST.c9]);
  });

  it('a miss K.O.s nothing, but the Event is still played and trashed', () => {
    const g = board(COST.c3, [COST.c2]);
    fire(g, 2);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([COST.c2]);
    expect(trash(g)).toEqual([MAMA]);
    expect(deck(g, 'p2')[0]).toBe(COST.c3);
  });

  it('"up to 1": may K.O. none; only one of two qualifying Characters falls', () => {
    const g = board(COST.c3, [COST.c1, COST.c2]);
    fire(g, 3);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toHaveLength(2);
    const h = board(COST.c3, [COST.c1, COST.c2]);
    fire(h, 3);
    pickCards(h, [COST.c1]);
    expect(chars(h, 'p2')).toEqual([COST.c2]);
  });

  it('must not: my own Characters and the opposing Leader are not offered', () => {
    const g = board(COST.c3, [COST.c2], { characters: [COST.c1] });
    fire(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST.c2]);
    none(g);
    expect(chars(g, 'p1')).toEqual([COST.c1]);
  });

  it('[Trigger]: activated from Life, one DON!! card is added from the DON!! deck, active; the card is trashed', () => {
    const g = underAttack();
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 0, deck: 9 });
    expect(trash(g)).toEqual([MAMA]);
    expect(hand(g)).toEqual([]);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('[Trigger] declined: the card goes to the hand and no DON!! is added', () => {
    const g = underAttack();
    hitLeader(g);
    need(g, 'trigger', 'p1');
    declineTrigger(g);
    expect(hand(g)).toEqual([MAMA]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });

  it('[Trigger] with an empty DON!! deck adds nothing and does not stall the game', () => {
    const g = underAttack(true);
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    takeMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 10, deck: 0 });
    expect(kind(g)).not.toBe('trigger');
  });

  it('the [Main] effect is not run by the [Trigger]: no number is asked when it is activated from Life', () => {
    const g = underAttack();
    hitLeader(g);
    activateTrigger(g);
    takeMost(g);
    expect(askingCost(g, 'p1')).toBe(false);
    expect(hasEvent(g, 'CardRevealed')).toBe(false);
  });
});
