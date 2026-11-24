/**
 * OP17-053 Barbell (Character, Blue, cost 5, 7000, no Counter, {Fish-Man}/{Rocks Pirates}).
 *
 * Card text: "[On K.O.] Your opponent places 2 cards from their hand at the bottom of their deck in
 * any order. [Activate: Main] [Once Per Turn] You may trash 1 card from your hand: This Character
 * gains +3000 power during this turn"
 *
 * Rules: CR 10-2-17 ([On K.O.] only for a K.O., not for other removal; RD 110), CR 10-2-1-3, CR 3-1-7
 * (owner orders cards entering an area), CR 8-3-1-3 (cost), CR 10-2-13 ([Once Per Turn]),
 * CR 6-6-1-3 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  BLUE,
  cardIds,
  deck,
  hand,
  kind,
  LD,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  passBlock,
  payHand,
  pickCards,
  play,
  SCN,
  theirs,
  toMyNextMain,
  trash,
  unusable,
  useAbility,
  decision,
} from './kit-op17b.ts';

const BARBELL = 'OP17-053';
const KINGDOM = 'EB01-059'; // Yellow Event cost 6: [Main] K.O. up to 1 opposing Character, then Life down to 1
const GRAVITY = 'OP06-058'; // Blue Event cost 7: place up to 2 Characters (cost <= 6) at the bottom of the owner's deck. Barbell is cost 5.

/** p2 K.O.s my rested Barbell with a 7000 attacker (Barbell has 7000 power). */
function koed(p2hand: string[]) {
  const g = theirs(
    LD.rocks,
    { characters: [{ card: BARBELL, rested: true }] },
    { characters: [SCN.c5], hand: p2hand },
  );
  attack(g, g.find('p2', 'characters', SCN.c5), g.find('p1', 'characters', BARBELL));
  passBlock(g);
  act(g, { type: 'endCounter' });
  return g;
}

describe('OP17-053 Barbell: [On K.O.] the opponent places 2 cards from their hand at the bottom of their deck', () => {
  it("when K.O.'d in battle, the OPPONENT chooses 2 cards of their own hand and they go to the bottom of their deck", () => {
    const g = koed([SCN.c2, SCN.c3, SCN.c4]);
    need(g, 'choose', 'p2');
    expect(offeredIds(g).length).toBeGreaterThanOrEqual(2);
    pickCards(g, [SCN.c2, SCN.c4]);
    while (kind(g) === 'order') {
      expect(decision(g)?.player).toBe('p2');
      g.act(g.legal().find((a) => a.type === 'order')!);
    }
    expect(hand(g, 'p2')).toEqual([SCN.c3]);
    expect(deck(g, 'p2').slice(-2).sort()).toEqual([SCN.c2, SCN.c4].sort());
    expect(trash(g, 'p2')).toEqual([]);
    expect(trash(g)).toEqual([BARBELL]);
  });

  it('exactly 2: the chooser cannot stop at 1 card when 3 are in hand', () => {
    const g = koed([SCN.c2, SCN.c3, SCN.c4]);
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c2]);
    need(g, 'choose', 'p2');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('with exactly 2 cards in hand both are placed (boundary)', () => {
    const g = koed([SCN.c2, SCN.c3]);
    if (kind(g) === 'choose') pickCards(g, [SCN.c2, SCN.c3]);
    while (kind(g) === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    expect(hand(g, 'p2')).toEqual([]);
    expect(deck(g, 'p2').slice(-2).sort()).toEqual([SCN.c2, SCN.c3].sort());
  });

  it('with only 1 card in hand that card is placed (as many as possible); nothing is asked of an empty hand', () => {
    const g = koed([SCN.c2]);
    if (kind(g) === 'choose') pickCards(g, [SCN.c2]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(deck(g, 'p2').at(-1)).toBe(SCN.c2);
    const e = koed([]);
    expect(kind(e)).toBe('main');
    expect(decision(e)?.player).toBe('p2');
  });

  it("also triggers when Barbell is K.O.'d by an opposing effect (any K.O.)", () => {
    const g = theirs(
      LD.rocks,
      { characters: [BARBELL] },
      { hand: [KINGDOM, SCN.c2, SCN.c3, SCN.c4], characters: [] },
    );
    play(g, g.find('p2', 'hand', KINGDOM));
    pickCards(g, [BARBELL]);
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c2, SCN.c3]);
    expect(deck(g, 'p2').slice(-2).sort()).toEqual([SCN.c2, SCN.c3].sort());
    expect(hand(g, 'p2')).toEqual([SCN.c4]);
  });

  it('does not trigger when Barbell is removed without a K.O. (placed at the bottom of the deck)', () => {
    const g = theirs(LD.rocks, { characters: [BARBELL] }, { hand: [GRAVITY, SCN.c2, SCN.c3] });
    play(g, g.find('p2', 'hand', GRAVITY));
    pickCards(g, [BARBELL]);
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toEqual([SCN.c2, SCN.c3].sort());
  });

  it("is Barbell's own effect: it does not fire when a different Character of mine is K.O.'d", () => {
    const g = theirs(
      LD.rocks,
      { characters: [BARBELL, { card: SCN.c3, rested: true }] },
      { characters: [SCN.c5], hand: [SCN.c2, SCN.c4] },
    );
    attack(g, g.find('p2', 'characters', SCN.c5), g.find('p1', 'characters', SCN.c3));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toEqual([SCN.c2, SCN.c4].sort());
    expect(cardIds(g, 'p1', 'characters')).toEqual([BARBELL]);
  });
});

describe('OP17-053 Barbell: [Activate: Main] [Once Per Turn] trash 1: +3000 this turn', () => {
  const field = (handCards: string[]) => mine(LD.rocks, { characters: [BARBELL], hand: handCards });

  it('trashing 1 card gives Barbell +3000 power during this turn', () => {
    const g = field([BLUE, SCN.c2]);
    const b = at(g, 'p1', 'characters', BARBELL);
    expect(g.power(b)).toBe(7000);
    useAbility(g, b);
    payHand(g, [SCN.c2]);
    expect(atMain(g)).toBe(true);
    expect(g.power(b)).toBe(10000);
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g)).toEqual([SCN.c2]);
  });

  it('lasts only this turn: back to 7000 on my next turn', () => {
    const g = field([BLUE]);
    const b = at(g, 'p1', 'characters', BARBELL);
    useAbility(g, b);
    payHand(g, [BLUE]);
    toMyNextMain(g);
    expect(g.power(at(g, 'p1', 'characters', BARBELL))).toBe(7000);
  });

  it('the cost is exactly 1 card of my choice from hand: every hand card is offered, and none can be skipped', () => {
    const g = field([BLUE, SCN.c2]);
    const b = at(g, 'p1', 'characters', BARBELL);
    useAbility(g, b);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BLUE, SCN.c2].sort());
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    expect(g.power(b)).toBe(7000);
  });

  it('not activating costs nothing: hand and power are unchanged', () => {
    const g = field([BLUE]);
    expect(g.power(at(g, 'p1', 'characters', BARBELL))).toBe(7000);
    expect(hand(g)).toEqual([BLUE]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', BARBELL))).toHaveLength(1);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid', () => {
    const g = field([]);
    const b = at(g, 'p1', 'characters', BARBELL);
    if (offeredAbilities(g, b).length) {
      useAbility(g, b);
      unusable(g, 'p1');
    }
    expect(g.power(b)).toBe(7000);
  });

  it('[Once Per Turn]: not offered a second time even with cards left in hand', () => {
    const g = field([BLUE, SCN.c2, SCN.c3]);
    const b = at(g, 'p1', 'characters', BARBELL);
    useAbility(g, b);
    payHand(g, [BLUE]);
    expect(offeredAbilities(g, b)).toHaveLength(0);
    expect(g.power(b)).toBe(10000);
  });

  it("CR 3-7-6-1-1: trashed to make room for a sixth Character it is not K.O.'d, so [On K.O.] does not fire", () => {
    const g = mine(
      LD.rocks,
      { hand: [SCN.c5], characters: [BARBELL, SCN.c1, SCN.c2, SCN.c3, SCN.c4] },
      { hand: [SCN.c2, SCN.c3, SCN.c4] },
    );
    act(g, { type: 'playCard', card: g.find('p1', 'hand', SCN.c5) });
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('characterLimit');
    pickCards(g, [BARBELL]);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([BARBELL]);
    expect(hand(g, 'p2')).toEqual([SCN.c2, SCN.c3, SCN.c4].sort());
    expect(g.eventsOfType('KO')).toHaveLength(0);
  });
});
