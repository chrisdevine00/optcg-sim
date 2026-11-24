/**
 * ST36-001 Cavendish (Yellow Character, cost 3, 3000, Counter +2000, Slash, {Beautiful Pirates}/{Supernovas}/{Dressrosa}).
 *
 * Card text: "[On K.O.] You may trash 1 card from your hand: Add up to 1 card from the top of your deck to the
 * top of your Life cards."
 *
 * Rules: CR 8-1-3 ([On K.O.] resolves after the K.O.), RD 120 (an unpayable cost cannot be paid), CR
 * 8-4-4-1 ("up to"), RL-26 (a deck at 0 cards loses the game), a card added to Life is face-down.
 */
import { describe, expect, it } from 'vitest';
import { result } from '../../helpers.ts';
import {
  attack,
  BLUE,
  cardIds,
  deck,
  fill,
  hand,
  LDB,
  lifeCards,
  mayPayHand,
  no,
  opponentKOs,
  passBlock,
  passCounter,
  SB,
  T,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-stb5b.ts';

const CAV = T.cavendish;
const TOP = SB.c3p5;

/** p2's Main Phase: p2's Hajrudin (6000) attacks the rested Cavendish; p1 does not block or counter. */
function koed(p1: Parameters<typeof theirs>[1] = {}) {
  const g = theirs(
    LDB.strike,
    {
      characters: [{ card: CAV, rested: true }],
      hand: [SB.c1p3],
      deck: [TOP, ...fill(BLUE, 14)],
      life: fill(BLUE, 4),
      ...p1,
    },
    { characters: [SB.c4p6] },
  );
  attack(g, g.find('p2', 'characters', SB.c4p6), g.find('p1', 'characters', CAV));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('ST36-001 Cavendish: [On K.O.] may trash 1 card from hand: add up to 1 card from the top of the deck to the top of Life', () => {
  it('trash 1: the top card of the deck becomes the top Life card, face down', () => {
    const g = koed();
    mayPayHand(g, [SB.c1p3]);
    // "up to 1": a choice may be asked; take the one card.
    yes(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([CAV, SB.c1p3].sort());
    expect(g.life('p1')).toBe(5);
    expect(lifeCards(g)[0]).toBe(TOP);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(deck(g)).toHaveLength(14);
  });

  it('the added card is on TOP of Life: it is the first card taken by the next damage', () => {
    const g = koed();
    mayPayHand(g, [SB.c1p3]);
    yes(g);
    expect(lifeCards(g)).toEqual([TOP, ...fill(BLUE, 4)]);
  });

  it('declining the "you may": nothing is trashed and no Life is added', () => {
    const g = koed();
    no(g);
    expect(hand(g)).toEqual([SB.c1p3]);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(15);
    expect(trash(g, 'p1')).toEqual([CAV]);
  });

  it('RD 120: with an empty hand the cost cannot be paid and no Life is added', () => {
    const g = koed({ hand: [] });
    unusable(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(15);
  });

  it('"up to 1": the player may add nothing (the cost is paid)', () => {
    const g = koed();
    mayPayHand(g, [SB.c1p3]);
    no(g);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(15);
    expect(trash(g, 'p1')).toContain(SB.c1p3);
  });

  it('only one card is added', () => {
    const g = koed();
    mayPayHand(g, [SB.c1p3]);
    yes(g);
    expect(g.life('p1')).toBe(5);
    expect(deck(g)).toHaveLength(14);
  });

  it('it also fires when an opposing effect K.O.s Cavendish (Gum-Gum Lightning)', () => {
    const g = theirs(
      LDB.strike,
      {
        characters: [CAV],
        hand: [SB.c1p3],
        deck: [TOP, ...fill(BLUE, 14)],
        life: fill(BLUE, 4),
      },
      { hand: ['OP09-077'] },
    );
    opponentKOs(g, g.find('p1', 'characters', CAV));
    mayPayHand(g, [SB.c1p3]);
    yes(g);
    expect(g.life('p1')).toBe(5);
  });

  it('it does not fire when Cavendish leaves the field without being K.O.ed (not applicable control: still on the field)', () => {
    const g = theirs(
      LDB.strike,
      { characters: [CAV], hand: [SB.c1p3], deck: [TOP, ...fill(BLUE, 14)] },
      { characters: [SB.c4p6] },
    );
    // An unrested Cavendish cannot be attacked: no K.O., no [On K.O.].
    expect(
      g.legal().some((a) => a.type === 'attack' && a.target === g.find('p1', 'characters', CAV)),
    ).toBe(false);
    expect(g.life('p1')).toBe(4);
  });

  it('RL-26: adding the last card of the deck to Life empties the deck and loses the game', () => {
    const g = koed({ deck: [TOP] });
    mayPayHand(g, [SB.c1p3]);
    yes(g);
    expect(deck(g)).toHaveLength(0);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });
});
