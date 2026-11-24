/**
 * OP17-099 Charlotte Linlin (Leader, Yellow, 5000, 5 Life, {The Four Emperors}/{Big Mom Pirates}).
 *
 * Card text: "[When Attacking] You may trash 1 card from your hand: Your opponent chooses one:
 * - Trash 1 card from your hand. Then, add up to 1 card from the top of your deck to the top of your
 *   Life cards.
 * - Trash 1 card from your opponent's hand."
 *
 * Reading (M6b-Q15, E-Q5): "your" is the Leader's controller; the opponent chooses the mode; in
 * the second mode the controller picks the card blind from the opponent's hand.
 * Rules: CR 8-3-1-3 (cost), CR 4-10-2 ("Then" after a clause that cannot be resolved), CR 4-8-1
 * ("up to"), RD 107 (a card placed on top of Life goes face-down), CR 7-1-1-3 ([When Attacking]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  deck,
  fill,
  hand,
  kind,
  LD,
  lifeCards,
  mine,
  need,
  no,
  passBlock,
  payHand,
  pickCards,
  SCN,
  trash,
  unusable,
  yes,
  decision,
} from './kit-op17b.ts';

const MODE_OWN = { option: '0' }; // "Trash 1 card from your hand. Then add up to 1 ... Life"
const MODE_THEIRS = { option: '1' }; // "Trash 1 card from your opponent's hand"

function swing(
  o: { hand?: string[]; p2hand?: string[]; life?: string[]; deckCards?: string[] } = {},
) {
  const g = mine(
    LD.linlin,
    {
      hand: o.hand ?? [SCN.c2, SCN.c3, SCN.c4],
      life: o.life ?? fill(BLUE, 3),
      deck: o.deckCards ?? [SCN.c8, ...fill(BLUE, 14)],
    },
    { hand: o.p2hand ?? [SCN.c5, SCN.c6] },
  );
  attack(g, g.leader('p1'), g.leader('p2'));
  return g;
}

/** Pay the cost with `card` and arrive at the OPPONENT's mode choice. */
function toMode(g: ReturnType<typeof swing>, card: string) {
  need(g, 'optional', 'p1');
  yes(g);
  payHand(g, [card]);
  const d = need(g, 'choose', 'p2');
  expect(d.purpose).toBe('mode');
  expect(d.options).toHaveLength(2);
}

describe('OP17-099 Charlotte Linlin: [When Attacking] trash 1: the opponent chooses a mode', () => {
  it('the cost is paid first (1 card of my hand) and then the OPPONENT, not I, chooses the mode', () => {
    const g = swing();
    toMode(g, SCN.c2);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(decision(g)?.player).toBe('p2');
  });

  it('mode 1: I trash 1 more card from my own hand, then add the top card of my deck to the top of my Life', () => {
    const g = swing();
    toMode(g, SCN.c2);
    act(g, { type: 'pick', choice: MODE_OWN });
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c3]);
    need(g, 'optional', 'p1'); // "add up to 1 card": a yes/no for the single card
    yes(g);
    expect(kind(g)).toBe('block');
    expect(trash(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(g.life('p1')).toBe(4);
    expect(lifeCards(g)[0]).toBe(SCN.c8);
    expect(deck(g)).toHaveLength(14);
    expect(hand(g)).toEqual([SCN.c4]);
  });

  it('mode 1 puts the card on the TOP of Life, face-down', () => {
    const g = swing();
    toMode(g, SCN.c2);
    act(g, { type: 'pick', choice: MODE_OWN });
    pickCards(g, [SCN.c3]);
    need(g, 'optional', 'p1');
    yes(g);
    expect(g.zone('p1', 'life')[0]?.faceUp).toBe(false);
  });

  it('mode 1: "up to 1" - I may decline the Life card; the trash stays done and no Life is added', () => {
    const g = swing();
    toMode(g, SCN.c2);
    act(g, { type: 'pick', choice: MODE_OWN });
    pickCards(g, [SCN.c3]);
    need(g, 'optional', 'p1');
    no(g);
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(deck(g)).toHaveLength(15);
  });

  it("mode 2: I trash 1 card from the OPPONENT's hand; I lose nothing more and gain no Life", () => {
    const g = swing();
    toMode(g, SCN.c2);
    act(g, { type: 'pick', choice: MODE_THEIRS });
    expect(kind(g)).toBe('block'); // the blind trash needs no further answer
    expect(hand(g, 'p2')).toHaveLength(1);
    expect(trash(g, 'p2')).toHaveLength(1);
    expect([SCN.c5, SCN.c6]).toContain(trash(g, 'p2')[0]);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(hand(g)).toEqual([SCN.c3, SCN.c4].sort());
    expect(g.life('p1')).toBe(3);
  });

  it('mode 2 with an empty opposing hand: nothing happens', () => {
    const g = swing({ p2hand: [] });
    toMode(g, SCN.c2);
    act(g, { type: 'pick', choice: MODE_THEIRS });
    expect(trash(g, 'p2')).toEqual([]);
    expect(kind(g)).toBe('block');
  });

  it('mode 1 with no card left in my hand: nothing to trash, but the "Then" Life step still resolves (CR 4-10-2)', () => {
    const g = swing({ hand: [SCN.c2] });
    toMode(g, SCN.c2);
    act(g, { type: 'pick', choice: MODE_OWN });
    need(g, 'optional', 'p1');
    yes(g);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });

  it('declining the cost: nothing is trashed, the opponent is not asked, the attack goes on', () => {
    const g = swing();
    need(g, 'optional', 'p1');
    no(g);
    expect(hand(g)).toHaveLength(3);
    expect(kind(g)).toBe('block');
    expect(decision(g)?.player).toBe('p2');
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid and the opponent is not asked', () => {
    const g = swing({ hand: [] });
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(trash(g)).toEqual([]);
  });

  it('the cost is exactly 1 card of my choice (all hand cards are offered, none can be skipped)', () => {
    const g = swing();
    yes(g);
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it("the effect is the Leader's attack trigger: it is not asked when the Leader does not attack", () => {
    const g = mine(LD.linlin, { hand: [SCN.c2], characters: [SCN.c3] }, {});
    attack(g, g.find('p1', 'characters', SCN.c3), g.leader('p2'));
    expect(kind(g)).toBe('block');
    passBlock(g);
    expect(hand(g)).toEqual([SCN.c2]);
  });

  it('[When Attacking] also works when the Leader attacks a rested Character, not only the Leader', () => {
    const g = mine(
      LD.linlin,
      { hand: [SCN.c2, SCN.c3], life: fill(BLUE, 3) },
      { characters: [{ card: SCN.c4, rested: true }] },
    );
    attack(g, g.leader('p1'), g.find('p2', 'characters', SCN.c4));
    need(g, 'optional', 'p1');
  });
});
