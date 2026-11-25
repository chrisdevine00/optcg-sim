/**
 * OP09-052 Marco (Character, Blue, cost 3, 5000, no Counter, {Whitebeard Pirates}).
 *
 * Card text: "[Opponent's Turn] You may trash 1 card from your hand: When this Character is K.O.'d by
 * your opponent's effect, play this Character card from your trash rested."
 *
 * Rules: CR 10-2-17 / M6b-Q (K.O. by an opposing effect only: a battle K.O. does not count), the
 * cost is a "you may" paid from the hidden hand, so it is offered even when it cannot be paid
 * (accept illegal), CR 8-4 (exact 1 card).
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../../src/testing.ts';
import {
  at,
  atMain,
  canFinish,
  chars,
  hand,
  kind,
  L9,
  need,
  offeredIds,
  opponentKOs,
  payHand,
  theirs,
  theyKo,
  trash,
  V9,
  yes,
  no,
} from './kit-op09b.ts';

const MARCO = 'OP09-052';

function koedByEffect(handCards: string[]) {
  const g = theirs(L9.neutral, { characters: [MARCO], hand: handCards }, { hand: ['OP09-077'] });
  opponentKOs(g, at(g, 'p1', 'characters', MARCO));
  return g;
}

describe("OP09-052 Marco: [Opponent's Turn] you may trash 1 card from hand: when K.O.'d by an opposing effect, play this from the trash rested", () => {
  it('K.O.d by an opposing effect, accepting and trashing 1 hand card: Marco returns rested and the paid card is in the trash', () => {
    const g = koedByEffect([V9.c2, V9.c3]);
    yes(g, 'p1');
    payHand(g, [V9.c2]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([MARCO]);
    expect(g.card(at(g, 'p1', 'characters', MARCO)).rested).toBe(true);
    expect(hand(g)).toEqual([V9.c3]);
    expect(trash(g)).toEqual([V9.c2]);
  });

  it('declining the cost: Marco stays in the trash and the hand is untouched', () => {
    const g = koedByEffect([V9.c2, V9.c3]);
    no(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([MARCO]);
    expect(hand(g)).toEqual([V9.c2, V9.c3].sort());
  });

  it('the cost is exactly 1 card: with 3 in hand only the chosen one is trashed', () => {
    const g = koedByEffect([V9.c2, V9.c3, V9.c4]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c2, V9.c3, V9.c4].sort());
    expect(canFinish(g)).toBe(false);
    payHand(g, [V9.c3]);
    expect(hand(g)).toEqual([V9.c2, V9.c4].sort());
    expect(trash(g)).toEqual([V9.c3]);
  });

  it('with a single card in hand, accepting pays with that card (the pick may be made for me) and Marco returns', () => {
    const g = koedByEffect([V9.c2]);
    yes(g, 'p1');
    if (kind(g) === 'choose') payHand(g, [V9.c2]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([MARCO]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([V9.c2]);
  });

  it('with an empty hand the question is still asked (the opponent must not learn the hand is empty) but "use" is illegal', () => {
    const g = koedByEffect([]);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    no(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([MARCO]);
  });

  it('must not apply to a K.O. in battle: nothing is asked and Marco stays in the trash', () => {
    const g = theirs(
      L9.neutral,
      { characters: [{ card: MARCO, rested: true }], hand: [V9.c2, V9.c3] },
      { characters: [V9.c8] },
    );
    theyKo(g, at(g, 'p1', 'characters', MARCO), at(g, 'p2', 'characters', V9.c8));
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([MARCO]);
    expect(hand(g)).toEqual([V9.c2, V9.c3].sort());
  });

  it("must not apply to a K.O. by your own effect on the opponent's turn: nothing is asked and Marco stays in the trash", () => {
    // Planted scenery: p1's Leader has an [On Your Opponent's Attack] that K.O.s one of p1's own Characters.
    const g = theirs(
      L9.neutral,
      { characters: [MARCO], hand: [V9.c2, V9.c3] },
      { characters: [V9.c8] },
    );
    g.state = withAbilities(g.state, g.card(g.leader('p1')).card, [
      {
        id: 'own',
        kind: 'auto',
        when: ['onOpponentAttack'],
        effect: [{ do: { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } } }],
      } as unknown as Ability,
    ]);
    g.act({
      type: 'attack',
      attacker: at(g, 'p2', 'characters', V9.c8),
      target: g.leader('p1'),
    });
    if (kind(g) === 'choose') g.act(g.legal().find((a) => a.type === 'pick')!);
    expect(trash(g)).toEqual([MARCO]);
    expect(chars(g)).toEqual([]);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(hand(g)).toEqual([V9.c2, V9.c3].sort());
  });

  it('the returned Marco is a new card with the same text: K.O.d by a second opposing effect in the same turn it is offered again', () => {
    const g = theirs(
      L9.neutral,
      { characters: [MARCO], hand: [V9.c2, V9.c3, V9.c4] },
      { hand: ['OP09-077', 'OP09-077'] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', MARCO));
    yes(g, 'p1');
    payHand(g, [V9.c2]);
    expect(chars(g)).toEqual([MARCO]);
    opponentKOs(g, at(g, 'p1', 'characters', MARCO));
    yes(g, 'p1');
    payHand(g, [V9.c3]);
    expect(chars(g)).toEqual([MARCO]);
    expect(trash(g)).toEqual([V9.c2, V9.c3].sort());
    expect(hand(g)).toEqual([V9.c4]);
  });
});
