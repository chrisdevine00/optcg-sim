/**
 * EB04-022 Issho (Character, cost 5, 7000, no Counter, {Navy}/{Dressrosa}).
 *
 * Card text: "[On Play] You may trash 2 cards from your hand: If your opponent has 6 or more cards in
 * their hand, your opponent places 2 cards from their hand at the bottom of their deck in any order.
 * [DON!! x1] [When Attacking] You may trash 1 card from your hand: Give up to 1 of your opponent's
 * Characters −2000 power during this turn."
 *
 * Rules: CR 8-3-1-3/-4 (optional costs; a hand cost is asked even when unpayable, "use" illegal);
 * the cost is paid before the condition is read; the OPPONENT chooses which 2 cards to place; the
 * opponent's hand count is public; [DON!! x1] needs 1+ DON!! given to this Character; "up to 1".
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
  no,
  none,
  offeredIds,
  payHand,
  pickInst,
  playRaw,
  SN,
  trash,
  yes,
} from './kit-eb04a.ts';

const ISSHO = 'EB04-022';
const P2HAND = [SN.c4, SN.c5, SN.c6, SN.c7, SN.c3, SN.c2, SN.c1];
const P2DECK = fill(BLUE, 8);

function onPlay(oppHand: string[], myHand: string[] = [SN.c1, SN.c2, SN.c3]) {
  const g = mine(LE.luffy, { hand: [ISSHO, ...myHand] }, { hand: oppHand, deck: P2DECK });
  playRaw(g, ISSHO);
  return g;
}

/** The opponent answers "place 2 cards" by taking the first offered pick each time, and any order. */
function oppPlaces(g: ReturnType<typeof onPlay>, cards: string[]) {
  let guard = 0;
  while (decision(g)?.player === 'p2' && guard++ < 8) {
    const d = decision(g)!;
    if (d.kind === 'order') {
      act(
        g,
        g.legal().find((a) => a.type === 'order')!,
      );
    } else {
      const wanted = choices(g).find((i) => cards.includes(g.card(i).card));
      act(g, { type: 'pick', choice: wanted ?? choices(g)[0]! });
    }
  }
}

describe('EB04-022 Issho [On Play]: you may trash 2 cards: if the opponent has 6+ cards in hand they place 2 at the bottom of their deck', () => {
  it('printed values: cost 5, 7000', () => {
    const g = mine(LE.luffy, { hand: [ISSHO] }, {});
    const c = g.card(g.find('p1', 'hand', ISSHO));
    expect(c.cost).toBe(5);
    expect(c.power).toBe(7000);
  });

  it('opponent with 6 cards: after I trash 2, the OPPONENT picks 2 cards of their own hand for the bottom of their deck', () => {
    const g = onPlay(P2HAND.slice(0, 6));
    yes(g, 'p1');
    payHand(g, [SN.c1, SN.c2]);
    expect(trash(g).sort()).toEqual([SN.c1, SN.c2].sort());
    expect(hand(g)).toEqual([SN.c3]);
    expect(decision(g)!.player).toBe('p2');
    need(g, 'choose', 'p2');
    expect(offeredIds(g).every((c) => (P2HAND as string[]).slice(0, 6).includes(c!))).toBe(true);
    oppPlaces(g, [SN.c4, SN.c5]);
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toHaveLength(4);
    const deck = cardIds(g, 'p2', 'deck');
    expect(deck).toHaveLength(10);
    expect(deck.slice(0, 8)).toEqual(P2DECK);
    expect([...deck.slice(8)].sort()).toEqual([SN.c4, SN.c5].sort());
  });

  it('the opponent chooses which 2: choosing the two strongest cards is possible (no card is forced)', () => {
    const g = onPlay(P2HAND.slice(0, 6));
    yes(g, 'p1');
    payHand(g, [SN.c1, SN.c2]);
    oppPlaces(g, [SN.c6, SN.c7]);
    expect(hand(g, 'p2').sort()).toEqual([SN.c4, SN.c5, SN.c3, SN.c2].sort());
  });

  it('boundary: the opponent has 5 cards: the cost is paid but the opponent places nothing and is asked nothing', () => {
    const g = onPlay(P2HAND.slice(0, 5));
    yes(g, 'p1');
    payHand(g, [SN.c1, SN.c2]);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toHaveLength(2);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(cardIds(g, 'p2', 'deck')).toHaveLength(8);
  });

  it('boundary: the opponent has 7 cards: still only 2 are placed', () => {
    const g = onPlay(P2HAND);
    yes(g, 'p1');
    payHand(g, [SN.c1, SN.c2]);
    oppPlaces(g, [SN.c4, SN.c5]);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(cardIds(g, 'p2', 'deck')).toHaveLength(10);
  });

  it('"you may": declining trashes nothing and the opponent keeps their hand', () => {
    const g = onPlay(P2HAND.slice(0, 6));
    no(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(hand(g)).toHaveLength(3);
    expect(hand(g, 'p2')).toHaveLength(6);
  });

  it('with only 1 other card in hand the cost (trash 2) cannot be paid: "use" is not offered', () => {
    const g = onPlay(P2HAND.slice(0, 6), [SN.c1]);
    need(g, 'optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    no(g, 'p1');
    expect(hand(g)).toEqual([SN.c1]);
    expect(hand(g, 'p2')).toHaveLength(6);
  });

  it('exactly 2 other cards in hand: they are both trashed (the cost is exact)', () => {
    const g = onPlay(P2HAND.slice(0, 6), [SN.c1, SN.c2]);
    yes(g, 'p1');
    if (kind(g) === 'choose' && decision(g)!.player === 'p1') payHand(g, [SN.c1, SN.c2]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toHaveLength(2);
  });
});

describe('EB04-022 Issho [DON!! x1] [When Attacking]: you may trash 1 card: give up to 1 opposing Character -2000 this turn', () => {
  function attacker(don: number, myHand: string[] = [SN.c1, SN.c2]) {
    const g = mine(
      LE.luffy,
      {
        hand: myHand,
        characters: [{ card: ISSHO, don }],
        costArea: { active: 10 - don, rested: 0 },
      },
      { characters: [SN.c4, SN.c5] },
    );
    attack(g, at(g, 'p1', 'characters', ISSHO), g.leader('p2'));
    return g;
  }

  it('with 1 DON!! given: trash 1 card, the chosen opposing Character gets -2000', () => {
    const g = attacker(1);
    yes(g, 'p1');
    payHand(g, [SN.c1]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c4, SN.c5].sort());
    pickInst(g, [at(g, 'p2', 'characters', SN.c5)]);
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(5000);
    expect(g.power(at(g, 'p2', 'characters', SN.c4))).toBe(6000);
    expect(trash(g)).toEqual([SN.c1]);
  });

  it('without a DON!! given the effect does not exist: no prompt at all', () => {
    const g = attacker(0);
    expect(kind(g)).toBe('block');
    expect(hand(g)).toHaveLength(2);
  });

  it('"you may": declining trashes nothing and changes no power', () => {
    const g = attacker(1);
    no(g, 'p1');
    expect(hand(g)).toHaveLength(2);
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(7000);
  });

  it('"up to 1": the -2000 may go to nobody (the card is still trashed); Leaders are never candidates', () => {
    const g = attacker(1);
    yes(g, 'p1');
    payHand(g, [SN.c2]);
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(trash(g)).toEqual([SN.c2]);
  });

  it('an empty hand: the cost cannot be paid, "use" is not offered', () => {
    const g = attacker(1, []);
    need(g, 'optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    no(g, 'p1');
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(7000);
  });
});
