/**
 * ST25-005 Mohji (Character, Blue, cost 4, 1000, Counter +2000, {Cross Guild}).
 *
 * Card text:
 *   If you have 2 or more Characters with a base cost of 5 or more, this Character gains [Blocker] and +1 cost.
 *   [On K.O.] If your Leader is [Buggy] and you have 3 or less cards in your hand, draw 1 card.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import { atMain, BLUE, deck, hand, kw, mine, need, theirs, trash } from '../op17/kit-op17b.ts';
import { block, inst, kind, LC, opponentKOs, SCL, SCN2 } from './kit-lfc.ts';

const MOHJI = 'ST25-005';

function field(chars: string[], p2chars: string[] = []) {
  return mine(LC.plain, { characters: chars }, { characters: p2chars });
}

/** p1 (Leader `leader`, `hand`) has a rested Mohji; p2's Leader (5000) K.O.s it in battle. */
function koed(leader: string, handCards: string[], extra: string[] = []) {
  const g = theirs(
    leader,
    {
      hand: handCards,
      deck: [SCL.c6, BLUE, BLUE, BLUE, BLUE],
      characters: [{ card: MOHJI, rested: true }, ...extra],
    },
    {},
  );
  attack(g, g.leader('p2'), inst(g, 'p1', 'characters', MOHJI));
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
  return g;
}

describe('ST25-005 Mohji: with 2+ Characters of base cost 5+ gains [Blocker] and +1 cost; [On K.O.] draw 1 with Leader [Buggy] and 3 or fewer cards in hand', () => {
  it('with two Characters of base cost 5 or more it has [Blocker] and costs 5', () => {
    const g = field([MOHJI, SCL.c5, SCL.cg5]);
    const m = inst(g, 'p1', 'characters', MOHJI);
    expect(kw(g, m)).toContain('Blocker');
    expect(g.card(m).cost).toBe(5);
  });

  it('with one Character of base cost 5 or more, or only cost 4 ones, it has neither', () => {
    const g = field([MOHJI, SCL.c5, SCL.c4, SCL.c4]);
    const m = inst(g, 'p1', 'characters', MOHJI);
    expect(kw(g, m)).not.toContain('Blocker');
    expect(g.card(m).cost).toBe(4);
  });

  it('[On K.O.] with Leader [Buggy] and 3 cards in hand: draws 1', () => {
    const g = koed(LC.buggy, [SCL.c2, SCL.c3, SCL.c4]);
    expect(trash(g)).toEqual([MOHJI]);
    expect(hand(g)).toEqual([SCL.c2, SCL.c3, SCL.c4, SCL.c6].sort());
    expect(deck(g)).toHaveLength(4);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('boundary: with 4 cards in hand it does not draw', () => {
    const g = koed(LC.buggy, [SCL.c2, SCL.c3, SCL.c4, SCL.c5]);
    expect(trash(g)).toEqual([MOHJI]);
    expect(hand(g)).toHaveLength(4);
    expect(deck(g)).toHaveLength(5);
  });

  it('with an empty hand it draws 1', () => {
    const g = koed(LC.buggy, []);
    expect(hand(g)).toEqual([SCL.c6]);
  });

  it('with a Leader that is not [Buggy] it does not draw even with a small hand', () => {
    const g = koed(LC.plain, [SCL.c2]);
    expect(trash(g)).toEqual([MOHJI]);
    expect(hand(g)).toEqual([SCL.c2]);
    expect(deck(g)).toHaveLength(5);
  });

  it('there is no "may": the draw happens without a question', () => {
    const g = koed(LC.buggy, [SCL.c2]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toHaveLength(2);
  });

  it('is also an [On K.O.] when an effect K.O.s it (Gum-Gum Lightning)', () => {
    const g = theirs(
      LC.buggy,
      { hand: [SCL.c2], deck: [SCL.c6, BLUE, BLUE], characters: [MOHJI] },
      { hand: [SCN2.lightning], costArea: { active: 4, rested: 0 } },
    );
    opponentKOs(g, inst(g, 'p1', 'characters', MOHJI));
    expect(trash(g)).toEqual([MOHJI]);
    expect(hand(g)).toEqual([SCL.c2, SCL.c6].sort());
  });

  it('as a [Blocker] that loses the battle it is K.O.ed and draws', () => {
    const g = theirs(
      LC.buggy,
      { hand: [SCL.c2], deck: [SCL.c6, BLUE, BLUE], characters: [MOHJI, SCL.c5, SCL.c6] },
      { characters: [SCL.c8] },
    );
    attack(g, inst(g, 'p2', 'characters', SCL.c8), g.leader('p1'));
    block(g, inst(g, 'p1', 'characters', MOHJI));
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(trash(g)).toEqual([MOHJI]);
    expect(hand(g)).toEqual([SCL.c2, SCL.c6].sort());
    expect(g.life('p1')).toBe(4);
    need(g, 'main', 'p2');
  });
});
