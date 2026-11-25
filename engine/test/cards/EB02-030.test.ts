/** EB02-030 And That's When Somebody Makes Fun of Their Friend's Dream!!!!. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  endCounter,
  expectDecision,
  hand,
  passBlock,
  pick,
  trash,
} from './helpers.ts';
import {
  canAcceptNow,
  damageWithP2,
  koBy,
  plantOpponentEffect,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  theirs,
  useCounter,
  V,
} from './helpers-lfa.ts';
import { game } from './helpers.ts';

const ID = 'EB02-030';

/**
 * p2's turn: p2 attacks p1's rested Characters with 9000-power Characters; p1 holds the Event, two
 * spare cards and 2 active DON!!. Stops at the Counter Step of the first attack on `first`.
 */
const defend = (first: string = V.c1, handCards: string[] = [ID, V.c3, V.c4]) => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      characters: [
        { card: V.c1, rested: true },
        { card: V.c2, rested: true },
      ],
      hand: handCards,
      costArea: { active: 2, rested: 0 },
    },
    { leader: PLAIN_BLUE, characters: [V.c7, V.c6] },
    { activePlayer: 'p2', turn: 4 },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c7),
    target: g.find('p1', 'characters', first),
  });
  passBlock(g);
  expectDecision(g, 'counter', 'p1');
  return g;
};
const asked = (g: ReturnType<typeof defend>) =>
  dec(g)?.kind === 'optional' && dec(g)?.purpose === 'replacement';

describe("EB02-030 And That's When Somebody Makes Fun of Their Friend's Dream!!!!", () => {
  it("[Counter] a Character that would be K.O.'d in battle stays if you trash 1 card from your hand instead", () => {
    const g = defend();
    useCounter(g, ID);
    endCounter(g);
    expect(asked(g)).toBe(true);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c2].sort());
    expect(trash(g, 'p1')).toContain(V.c3);
    expect(trash(g, 'p1')).toContain(ID);
    expect(hand(g, 'p1')).toEqual([V.c4]);
  });

  it("declining lets the Character be K.O.'d and keeps the hand", () => {
    const g = defend();
    useCounter(g, ID);
    endCounter(g);
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c2]);
    expect(trash(g, 'p1')).toContain(V.c1);
    expect(hand(g, 'p1')).toEqual([V.c3, V.c4]);
  });

  it('M6b-Q54: it lasts the whole turn, so a second battle K.O. is offered it again', () => {
    const g = defend();
    useCounter(g, ID);
    endCounter(g);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    // p2's second attacker attacks the other Character: the replacement is offered again.
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c6),
      target: g.find('p1', 'characters', V.c2),
    });
    passBlock(g);
    endCounter(g);
    expect(asked(g)).toBe(true);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with an empty hand the replacement cannot be paid: the K.O. happens', () => {
    const g = defend(V.c1, [ID]);
    useCounter(g, ID);
    endCounter(g);
    // Offered, but nothing can be trashed: it cannot be accepted (or is not offered at all).
    expect(asked(g)).toBe(true);
    expect(canAcceptNow(g)).toBe(false);
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c2]);
  });

  it('must not apply to a K.O. by an effect, nor to a battle K.O. before the Event is played', () => {
    const g = defend();
    useCounter(g, ID);
    endCounter(g);
    decline(g);
    // Later the same turn p2 K.O.s the other Character with an effect: not covered, nothing asked.
    plantOpponentEffect(g, { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } });
    expect(dec(g)?.purpose).not.toBe('replacement');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    // And with no Event played, a battle K.O. is not offered anything.
    const h = defend();
    endCounter(h);
    expect(h.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c2]);
    expect(hand(h, 'p1')).toEqual([ID, V.c3, V.c4]);
  });

  it('must not cover your Leader: an attack on the Leader is not a K.O. of a Character', () => {
    const g = theirs(
      PLAIN_BLUE,
      { hand: [ID, V.c3], characters: [V.c1] },
      { characters: [V.c7] },
      2,
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.leader('p1'),
    });
    passBlock(g);
    useCounter(g, ID);
    endCounter(g);
    expect(asked(g)).toBe(false);
  });

  it("a Character of yours K.O.'d by an effect the same turn is not covered by battle-only text", () => {
    const g = theirs(
      PLAIN_BLUE,
      { hand: [ID, V.c3], characters: [V.c1] },
      { characters: [V.c7] },
      2,
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.leader('p1'),
    });
    passBlock(g);
    useCounter(g, ID);
    endCounter(g);
    // The battle is over; a K.O. by effect right after is not replaced.
    koBy(g, 'p1', V.c1, 'p2');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('[Trigger] draws 1 card', () => {
    const g = damageWithP2(ID, { hand: [V.c3] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c3, 'OP02-060']);
    expect(trash(g, 'p1')).toEqual([ID]);
  });
});
