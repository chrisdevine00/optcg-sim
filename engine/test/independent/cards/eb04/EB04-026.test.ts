/**
 * EB04-026 Bluegrass (Character, cost 4, 6000, no Counter, {Navy}/{Egghead}).
 *
 * Card text: "[On Play] Place up to 1 of your opponent's Characters with a cost of 1 or less at the
 * bottom of the owner's deck.
 * [When Attacking] Draw 1 card and trash 1 card from your hand."
 *
 * Rules: "up to 1" (CR 8-4-4-1); the removed card goes to the bottom of ITS OWNER's deck; cost is the
 * current cost; [When Attacking] is automatic: draw first, then trash a card of my choice.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  BLUE,
  cardIds,
  choices,
  decision,
  fill,
  hand,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  SN,
  trash,
} from './kit-eb04a.ts';

const BG = 'EB04-026';
const P2DECK = fill(BLUE, 6);

function onPlay(p2chars: string[], p1: Parameters<typeof mine>[1] = {}) {
  const g = mine(LE.luffy, { hand: [BG], ...p1 }, { characters: p2chars, deck: P2DECK });
  playRaw(g, BG);
  return g;
}

describe('EB04-026 Bluegrass [On Play]: place up to 1 opposing Character with cost 1 or less at the bottom of its owner deck', () => {
  it('printed values: cost 4, 6000, no Counter', () => {
    const g = mine(LE.luffy, { hand: [BG] }, {});
    const c = g.card(g.find('p1', 'hand', BG));
    expect(c.cost).toBe(4);
    expect(c.power).toBe(6000);
    expect(c.counter).toBeNull();
  });

  it('a cost-1 Character goes to the bottom of the opponent deck (not their hand, not their trash)', () => {
    const g = onPlay([SN.c1, SN.c5]);
    need(g, 'choose');
    pickInst(g, [at(g, 'p2', 'characters', SN.c1)]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'characters')).toEqual([SN.c5]);
    const deck = cardIds(g, 'p2', 'deck');
    expect(deck).toHaveLength(7);
    expect(deck.slice(0, 6)).toEqual(P2DECK);
    expect(deck[6]).toBe(SN.c1);
    expect(hand(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('boundary: only cost 1 or less is offered: a cost-2 and a cost-5 Character are not', () => {
    const g = onPlay([SN.c1, SN.c2, SN.c5]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c1]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('a cost-2 Character alone: nothing can be chosen and nothing happens', () => {
    const g = onPlay([SN.c2]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'characters')).toEqual([SN.c2]);
  });

  it('only opposing Characters are candidates: my own cost-1 Character and the Leaders are not', () => {
    const g = onPlay([SN.c1], { characters: [SN.c1] });
    need(g, 'choose');
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', SN.c1)]);
    none(g);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([BG, SN.c1].sort());
  });

  it('a rested cost-1 Character can be placed too', () => {
    const g = onPlay([{ card: SN.c1, rested: true } as never]);
    need(g, 'choose');
    pickInst(g, [at(g, 'p2', 'characters', SN.c1)]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });
});

describe('EB04-026 Bluegrass [When Attacking]: draw 1 card and trash 1 card from your hand', () => {
  const DECK = [SN.c6, SN.c7, SN.c3];
  function attacker(myHand: string[]) {
    const g = mine(
      LE.luffy,
      { characters: [BG], hand: myHand, deck: DECK },
      { characters: [SN.c4] },
    );
    attack(g, at(g, 'p1', 'characters', BG), g.leader('p2'));
    return g;
  }

  it('draws the top card, then I choose 1 card of my hand to trash', () => {
    const g = attacker([SN.c1, SN.c2]);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([SN.c1, SN.c2, SN.c6].sort());
    need(g, 'choose');
    act(g, { type: 'pick', choice: choices(g).find((i) => g.card(i).card === SN.c1)! });
    expect(hand(g)).toEqual([SN.c2, SN.c6].sort());
    expect(trash(g)).toEqual([SN.c1]);
    expect(cardIds(g, 'p1', 'deck')).toEqual(DECK.slice(1));
    expect(kind(g)).toBe('block');
    passBlock(g);
    passCounter(g);
  });

  it('the card just drawn may be the one trashed', () => {
    const g = attacker([SN.c1]);
    need(g, 'choose');
    act(g, { type: 'pick', choice: choices(g).find((i) => g.card(i).card === SN.c6)! });
    expect(hand(g)).toEqual([SN.c1]);
    expect(trash(g)).toEqual([SN.c6]);
  });

  it('an empty hand: draws 1, then trashes that card (it is the only one)', () => {
    const g = attacker([]);
    if (kind(g) === 'choose') {
      act(g, { type: 'pick', choice: choices(g)[0]! });
    }
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SN.c6]);
    expect(decision(g)!.kind).toBe('block');
  });
});
