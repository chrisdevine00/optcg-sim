/**
 * OP09-088 Shiryu (Character, Black, cost 3, 4000, Counter +2000, {Blackbeard Pirates}, Slash).
 *
 * Card text: "[DON!! x1] [When Attacking] You may trash 2 cards from your hand: Draw 2 cards."
 *
 * Rules: [DON!! x1] means at least 1 DON!! is given to this card. "You may" is optional; the cost is
 * paid from the hidden hand, so it is offered even when unpayable, with accept illegal (so the
 * opponent cannot read the hand size). [When Attacking] fires on the declaration of an attack.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  chr,
  deck,
  hand,
  kind,
  LD9,
  mine,
  need,
  no,
  offeredUnpayable,
  payHand,
  SC9,
  theirs,
  trash,
  yes,
} from './kit-op09c.ts';

const SHIRYU = 'OP09-088';
const DECK = [SC9.c8, SC9.c7, SC9.c6, SC9.c5, SC9.c4, SC9.c3];

function board(
  handCards: string[],
  o: { don?: number; p2chars?: (string | { card: string; rested?: boolean })[] } = {},
) {
  const don = o.don ?? 1;
  return mine(
    LD9.bbp,
    {
      characters: [{ card: SHIRYU, don }],
      hand: handCards,
      deck: DECK,
      costArea: { active: 10 - don, rested: 0 },
    },
    { characters: o.p2chars ?? [] },
  );
}

function swing(g: ReturnType<typeof board>) {
  attack(g, chr(g, 'p1', SHIRYU), g.leader('p2'));
}

describe('OP09-088 Shiryu: [DON!! x1] [When Attacking] you may trash 2 cards from hand: draw 2', () => {
  it('printed values: cost 3, 4000, Counter +2000 (5000 with a DON!! attached on my turn)', () => {
    const g = board([]);
    const c = g.card(chr(g, 'p1', SHIRYU));
    expect(c.cost).toBe(3);
    expect(c.counter).toBe(2000);
    expect(c.power).toBe(5000);
  });

  it('with 1 DON!! attached, attacking offers the "you may trash 2" question', () => {
    const g = board([SC9.c1, SC9.c2, SC9.c3]);
    swing(g);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
  });

  it('accepting: trash the 2 chosen cards, then draw 2 from the top of the deck', () => {
    const g = board([SC9.c1, SC9.c2, SC9.c3]);
    swing(g);
    yes(g);
    payHand(g, [SC9.c1, SC9.c3]);
    expect(trash(g)).toEqual([SC9.c1, SC9.c3].sort());
    expect(hand(g)).toEqual([SC9.c2, SC9.c8, SC9.c7].sort());
    expect(deck(g)[0]).toBe(SC9.c6);
    expect(kind(g)).toBe('block');
  });

  it('exactly 2 cards are trashed, exactly 2 are drawn', () => {
    const g = board([SC9.c1, SC9.c2, SC9.c3, SC9.c4]);
    swing(g);
    yes(g);
    payHand(g, [SC9.c1, SC9.c2]);
    expect(hand(g)).toHaveLength(4);
    expect(trash(g)).toHaveLength(2);
  });

  it('declining: nothing is trashed and nothing is drawn; the attack goes on', () => {
    const g = board([SC9.c1, SC9.c2, SC9.c3]);
    swing(g);
    no(g);
    expect(hand(g)).toEqual([SC9.c1, SC9.c2, SC9.c3].sort());
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length);
    expect(kind(g)).toBe('block');
  });

  it('boundary: with exactly 2 cards in hand the cost is payable', () => {
    const g = board([SC9.c1, SC9.c2]);
    swing(g);
    yes(g);
    payHand(g, [SC9.c1, SC9.c2]);
    expect(hand(g)).toEqual([SC9.c8, SC9.c7].sort());
    expect(trash(g)).toEqual([SC9.c1, SC9.c2].sort());
  });

  it('with only 1 card in hand the question is still asked, but "use" is not legal; nothing happens', () => {
    const g = board([SC9.c1]);
    swing(g);
    offeredUnpayable(g, 'p1');
    expect(hand(g)).toEqual([SC9.c1]);
    expect(trash(g)).toEqual([]);
    expect(kind(g)).toBe('block');
  });

  it('with an empty hand the question is also asked with "use" illegal', () => {
    const g = board([]);
    swing(g);
    offeredUnpayable(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length);
  });

  it('[DON!! x1]: with no DON!! attached the attack does not offer the effect at all', () => {
    const g = board([SC9.c1, SC9.c2, SC9.c3], { don: 0 });
    swing(g);
    expect(kind(g)).toBe('block');
    expect(hand(g)).toHaveLength(3);
  });

  it('[DON!! x1] means "at least": with 2 DON!! attached it is offered too', () => {
    const g = board([SC9.c1, SC9.c2, SC9.c3], { don: 2 });
    swing(g);
    need(g, 'optional', 'p1');
  });

  it('it also fires when attacking an opponent Character (any attack)', () => {
    const g = board([SC9.c1, SC9.c2], { p2chars: [{ card: SC9.c3, rested: true }] });
    attack(g, chr(g, 'p1', SHIRYU), chr(g, 'p2', SC9.c3));
    need(g, 'optional', 'p1');
  });

  it('must not fire when Shiryu is attacked instead (it is not a [When Attacking] on defence)', () => {
    const g = theirs(
      LD9.bbp,
      { characters: [{ card: SHIRYU, don: 1, rested: true }], hand: [SC9.c1, SC9.c2] },
      { characters: [SC9.c7] },
    );
    attack(g, chr(g, 'p2', SC9.c7), chr(g, 'p1', SHIRYU));
    // Defender: no optional about trashing 2 appears.
    expect(kind(g)).not.toBe('optional');
    act(g, { type: 'block', blocker: null });
    expect(hand(g)).toEqual([SC9.c1, SC9.c2].sort());
  });

  it('a different Character with the same text slot does not matter: my other attackers do not draw', () => {
    const g = mine(
      LD9.bbp,
      {
        characters: [SHIRYU, { card: SC9.c4, don: 1 }],
        hand: [SC9.c1, SC9.c2],
        costArea: { active: 9, rested: 0 },
      },
      {},
    );
    attack(g, chr(g, 'p1', SC9.c4), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(atMain(g)).toBe(false);
  });
});
