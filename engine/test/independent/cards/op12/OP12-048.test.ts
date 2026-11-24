/**
 * OP12-048 Donquixote Rosinante (Character, Blue, cost 1, 1000, Counter +1000, {Navy}).
 *
 * Card text: "[Opponent's Turn] If your blue "Navy" type Character would be removed from the field by
 * your opponent's effect, you may rest this Character and trash 1 card from your hand instead."
 *
 * Rules: a replacement effect (CR 8-1-3-4): optional because of "may"; an impossible replacement
 * cannot be applied (CR 8-1-3-4-5), so it needs an active Rosinante to rest and a card to trash.
 * It covers removal by the opponent's EFFECT only (K.O., return to hand, placing in the deck),
 * not battle, and only blue {Navy} Characters, Rosinante himself included.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  cast,
  chars,
  deck,
  hand,
  kind,
  LB,
  mine,
  need,
  noDefence,
  opponentKOs,
  pickInst,
  SB,
  theirs,
  trash,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ROSI = 'OP12-048';
/** OP11-061 Gum-Gum Jet Culverin: Event, cost 3. [Main] Place up to 1 of your opponent's Characters with a base cost of 4 or less at the bottom of the owner's deck. */
const CULVERIN = 'OP11-061';

/** p2's turn: Lightning K.O.s `target` (p1). p1 holds `h`. Stops at the first decision of p1. */
function koed(target: string, opts: { h?: string[]; rested?: boolean } = {}): TestGame {
  const g = theirs(
    LB.navy,
    {
      characters: [{ card: ROSI, rested: opts.rested ?? false }, target],
      hand: opts.h ?? [SB.sai],
    },
    { hand: ['OP09-077'] },
  );
  opponentKOs(g, g.find('p1', 'characters', target));
  return g;
}

describe('OP12-048 Rosinante: rest this and trash 1 instead of a blue Navy Character being removed by their effect', () => {
  it('K.O. by an opponent effect of a blue Navy Character: offered; accept rests Rosinante, trashes 1 card and the Character stays', () => {
    const g = koed(SB.navyBlue4);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    act(g, { type: 'optional', accept: true });
    if (kind(g) === 'choose') pickInst(g, [g.find('p1', 'hand', SB.sai)]);
    expect(chars(g)).toEqual([ROSI, SB.navyBlue4].sort());
    expect(g.card(g.find('p1', 'characters', ROSI)).rested).toBe(true);
    expect(trash(g)).toEqual([SB.sai]);
    expect(hand(g)).toEqual([]);
  });

  it('declining: the Character is K.O.d, Rosinante stays active and the hand is untouched', () => {
    const g = koed(SB.navyBlue4);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expect(chars(g)).toEqual([ROSI]);
    expect(g.card(g.find('p1', 'characters', ROSI)).rested).toBe(false);
    expect(trash(g)).toEqual([SB.navyBlue4]);
    expect(hand(g)).toEqual([SB.sai]);
  });

  it('Rosinante can protect himself: he rests and 1 card is trashed instead of his own K.O.', () => {
    const g = theirs(LB.navy, { characters: [ROSI], hand: [SB.sai] }, { hand: ['OP09-077'] });
    opponentKOs(g, g.find('p1', 'characters', ROSI));
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    if (kind(g) === 'choose') pickInst(g, [g.find('p1', 'hand', SB.sai)]);
    expect(chars(g)).toEqual([ROSI]);
    expect(g.card(g.find('p1', 'characters', ROSI)).rested).toBe(true);
    expect(trash(g)).toEqual([SB.sai]);
  });

  it('also covers a removal that is not a K.O.: placing at the bottom of the deck (Gum-Gum Jet Culverin)', () => {
    const g = theirs(
      LB.navy,
      { characters: [ROSI, SB.navyBlue4], hand: [SB.sai] },
      { hand: [CULVERIN] },
    );
    cast(g, CULVERIN);
    pickInst(g, [g.find('p1', 'characters', SB.navyBlue4)]);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    if (kind(g) === 'choose') pickInst(g, [g.find('p1', 'hand', SB.sai)]);
    expect(chars(g)).toEqual([ROSI, SB.navyBlue4].sort());
    expect(deck(g, 'p1')).toHaveLength(15);
    expect(trash(g)).toEqual([SB.sai]);
  });

  it('must not: a blue Character that is not {Navy} (Mohji) is not covered', () => {
    const g = koed(SB.mohji);
    // No replacement: Mohji is K.O.d with no question.
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([ROSI]);
    expect(trash(g)).toEqual([SB.mohji]);
    expect(hand(g)).toEqual([SB.sai]);
  });

  it('must not: a {Navy} Character that is not blue (Komille, black) is not covered', () => {
    const g = koed(SB.navyBlack1);
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([ROSI]);
    expect(trash(g)).toEqual([SB.navyBlack1]);
  });

  it('impossible replacement: a rested Rosinante cannot rest again, so no offer is made', () => {
    const g = koed(SB.navyBlue4, { rested: true });
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([ROSI]);
    expect(trash(g)).toEqual([SB.navyBlue4]);
    expect(hand(g)).toEqual([SB.sai]);
  });

  it('unpayable cost: with an empty hand the replacement cannot be used and the K.O. happens', () => {
    const g = koed(SB.navyBlue4, { h: [] });
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expect(chars(g)).toEqual([ROSI]);
    expect(trash(g)).toEqual([SB.navyBlue4]);
  });

  it('must not: a K.O. in battle is not "removed by an effect": no offer, the Character is K.O.d', () => {
    const g = theirs(
      LB.navy,
      { characters: [ROSI, { card: SB.navyBlue4, rested: true }], hand: [SB.sai] },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.find('p1', 'characters', SB.navyBlue4));
    noDefence(g);
    expect(chars(g)).toEqual([ROSI]);
    expect(trash(g)).toEqual([SB.navyBlue4]);
    expect(hand(g)).toEqual([SB.sai]);
  });

  it('must not: my own Zephyr trashing itself as a cost on my turn is not replaced (not their effect, not their turn)', () => {
    const g = mine(LB.navy, { characters: [ROSI, 'OP12-046'], hand: [SB.sai] });
    const z = g.find('p1', 'characters', 'OP12-046');
    const ab = g
      .legal()
      .flatMap((a) => (a.type === 'activate' && a.card === z ? [a.ability] : []))[0]!;
    act(g, { type: 'activate', card: z, ability: ab });
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toContain('OP12-046');
    expect(g.card(g.find('p1', 'characters', ROSI)).rested).toBe(false);
  });
});
