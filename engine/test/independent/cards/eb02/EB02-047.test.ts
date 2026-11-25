/**
 * EB02-047 Blueno (Black Character, cost 5, 6000, Counter +1000, {CP9}).
 *
 * Card text: "[Activate: Main] You may trash 1 card from your hand and trash this Character: Play up to 1
 * Character card with a type including "CP" and a cost of 5 or less other than [Blueno] from your
 * trash."
 *
 * Rules: the cost is optional and has two parts (1 card from hand, this Character); the trashed hand
 * card and Blueno are in the trash before the effect resolves, but [Blueno] is excluded by name; the
 * quoted type matches any type including "CP"; "up to 1" may be 0 (CR 8-4-4-1); no restriction stops
 * an [Activate: Main] on the turn the Character was played. An optional cost paid from the hidden
 * hand is offered even when unpayable, with accept illegal.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canUseAbility,
  chars,
  hand,
  kind,
  LE,
  mine,
  need,
  no,
  none,
  offeredIds,
  payIfAsked,
  pickCards,
  SE,
  trash,
  useAbility,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const BLUENO = 'EB02-047';

/** p1 with Blueno on the field, `inHand` in hand and `inTrash` in the trash. */
function setup(inHand: string[], inTrash: string[], extra: string[] = [], placed = false) {
  return mine(LE.luffy, {
    characters: [placed ? { card: BLUENO, playedThisTurn: true } : BLUENO, ...extra],
    hand: inHand,
    trash: inTrash,
  });
}

/** Activate Blueno, say yes to the cost and pay the hand card; stops at the trash pick. */
function pay(g: ReturnType<typeof setup>, card: string) {
  useAbility(g, ch(g, 'p1', BLUENO));
  // Choosing to activate is choosing to pay: the cost pick follows (skipped by the engine when forced).
  payIfAsked(g, [card]);
}

describe('EB02-047 Blueno: printed values', () => {
  it('cost 5, 6000 power, Counter +1000, no keyword', () => {
    const g = setup([], []);
    const b = ch(g, 'p1', BLUENO);
    expect(g.card(b).cost).toBe(5);
    expect(g.power(b)).toBe(6000);
    expect(g.card(b).counter).toBe(1000);
    expect(g.card(b).keywords).toEqual([]);
  });
});

describe('EB02-047 Blueno: [Activate: Main] trash a hand card and this Character: play a "CP" Character with cost 5 or less from the trash', () => {
  it('trashes the hand card and Blueno, then plays the chosen CP Character from the trash', () => {
    const g = setup([SE.mohji], [SE.kalifa5]);
    pay(g, SE.mohji);
    need(g, 'choose', 'p1');
    pickCards(g, [SE.kalifa5]);
    expect(chars(g)).toEqual([SE.kalifa5]);
    expect(trash(g)).toEqual([BLUENO, SE.mohji].sort());
    expect(hand(g)).toEqual([]);
    expect(g.card(ch(g, 'p1', SE.kalifa5)).rested).toBe(false);
  });

  it('offers CP Characters with cost 5 or less and nothing else (not cost 6, not non-CP, not [Blueno])', () => {
    const g = setup(
      [SE.mohji],
      [SE.kalifa5, SE.jerry2, SE.nero3, SE.maha6, SE.laboon, SE.garp5, BLUENO],
    );
    pay(g, SE.mohji);
    need(g, 'choose', 'p1');
    // {CP9} cost 5, {CP6} cost 2 and {CP9} cost 3 qualify; {CP0} cost 6 is too expensive; another [Blueno] and the one just trashed are excluded by name.
    expect(offeredIds(g)).toEqual([SE.kalifa5, SE.jerry2, SE.nero3].sort());
  });

  it('boundary: a "CP" Character with cost 5 qualifies and one with cost 6 does not', () => {
    const g = setup([SE.mohji], [SE.maha6]);
    pay(g, SE.mohji);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([BLUENO, SE.mohji, SE.maha6].sort());
  });

  it('"up to 1": may play nothing (the cost stays paid)', () => {
    const g = setup([SE.mohji], [SE.kalifa5]);
    pay(g, SE.mohji);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([BLUENO, SE.kalifa5, SE.mohji].sort());
  });

  it('plays at most 1 Character', () => {
    const g = setup([SE.mohji], [SE.kalifa5, SE.nero3]);
    pay(g, SE.mohji);
    pickCards(g, [SE.nero3]);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([SE.nero3]);
    expect(trash(g)).toContain(SE.kalifa5);
  });

  it("the trashed hand card is the player's choice among several", () => {
    const g = setup([SE.mohji, SE.sai, SE.marco], [SE.kalifa5]);
    pay(g, SE.sai);
    pickCards(g, [SE.kalifa5]);
    expect(hand(g)).toEqual([SE.mohji, SE.marco].sort());
    expect(trash(g)).toEqual([BLUENO, SE.sai].sort());
  });

  it('with an empty hand the cost cannot be paid: the effect is not used and Blueno stays', () => {
    const g = setup([], [SE.kalifa5]);
    if (canUseAbility(g, ch(g, 'p1', BLUENO))) {
      useAbility(g, ch(g, 'p1', BLUENO));
      need(g, 'optional', 'p1');
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
    }
    expect(chars(g)).toEqual([BLUENO]);
    expect(trash(g)).toEqual([SE.kalifa5]);
  });

  it('"You may": not activating leaves everything unchanged', () => {
    const g = setup([SE.mohji], [SE.kalifa5]);
    expect(kind(g)).toBe('main');
    expect(canUseAbility(g, ch(g, 'p1', BLUENO))).toBe(true);
    expect(chars(g)).toEqual([BLUENO]);
    expect(hand(g)).toEqual([SE.mohji]);
    expect(trash(g)).toEqual([SE.kalifa5]);
  });

  it('can be used the turn it was played (no summoning-sickness limit on [Activate: Main])', () => {
    const g = setup([SE.mohji], [SE.nero3], [], true);
    expect(canUseAbility(g, ch(g, 'p1', BLUENO))).toBe(true);
    pay(g, SE.mohji);
    pickCards(g, [SE.nero3]);
    expect(chars(g)).toEqual([SE.nero3]);
  });

  it('with 5 Characters on the field Blueno leaves first, so the played Character needs no replacement', () => {
    const g = setup([SE.mohji], [SE.kalifa5], [SE.sai, SE.marco, SE.hajrudin, SE.kingdew]);
    pay(g, SE.mohji);
    pickCards(g, [SE.kalifa5]);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toHaveLength(5);
    expect(chars(g)).toContain(SE.kalifa5);
  });

  it("must not: the opponent's trash is not a source", () => {
    const g = mine(
      LE.luffy,
      { characters: [BLUENO], hand: [SE.mohji], trash: [] },
      { trash: [SE.kalifa5] },
    );
    pay(g, SE.mohji);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g)).toEqual([]);
    expect(chars(g, 'p2')).toEqual([]);
    void act;
  });
});
