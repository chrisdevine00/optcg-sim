/**
 * OP01-039 Killer (Character, Green, cost 2, 2000, Counter +1000, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new
 * target of the attack.) [DON!! x1] [On Block] If you have 3 or more Characters, draw 1 card."
 *
 * Rules: [DON!! x1] needs at least 1 DON!! given to this card (CR 8-1-3-1-?); [On Block] fires when
 * this Character blocks (CR 10-2-?); the "If" counts all of MY Characters (rested ones too, and Killer
 * himself) when the effect resolves; the draw is a fixed 1.
 */
import { describe, expect, it } from 'vitest';
import { act, C29, describeBlocker, fill, hand, inst, L29, theirs } from './kit-st29a.ts';

const ID = 'OP01-039';
const TOP = C29.c4;

describeBlocker({ id: ID, cost: 2, power: 2000, counter: 1000 });

/** p2's Leader attacks my Leader; I block with Killer. `others` are my other Characters. */
function block(o: {
  don: number;
  others: (string | { card: string; rested?: boolean })[];
  p2chars?: string[];
}) {
  const g = theirs(
    L29.croc,
    {
      characters: [{ card: ID, don: o.don }, ...o.others],
      deck: fill(TOP, 15),
      costArea: { active: 0, rested: 0 },
      hand: [],
    },
    { characters: o.p2chars ?? [] },
  );
  act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
  act(g, { type: 'block', blocker: inst(g, 'p1', 'characters', ID) });
  return g;
}

describe('OP01-039 Killer [DON!! x1] [On Block]: with 3 or more Characters, draw 1', () => {
  it('with 1 DON!! and exactly 3 Characters (Killer and 2 others) it draws 1', () => {
    const g = block({ don: 1, others: [C29.c1, C29.c2] });
    expect(hand(g)).toEqual([TOP]);
  });

  it('with 1 DON!! and only 2 Characters (one below the limit) it draws nothing', () => {
    const g = block({ don: 1, others: [C29.c1] });
    expect(hand(g)).toEqual([]);
  });

  it('without the DON!! it draws nothing even with 3 Characters', () => {
    const g = block({ don: 0, others: [C29.c1, C29.c2] });
    expect(hand(g)).toEqual([]);
  });

  it('with 2 DON!! given it still draws exactly 1 (the draw is not per DON!!)', () => {
    const g = block({ don: 2, others: [C29.c1, C29.c2, C29.c3] });
    expect(hand(g)).toEqual([TOP]);
  });

  it('rested Characters count: 3 Characters of which two are rested still make 3', () => {
    const g = block({
      don: 1,
      others: [
        { card: C29.c1, rested: true },
        { card: C29.c2, rested: true },
      ],
    });
    expect(hand(g)).toEqual([TOP]);
  });

  it('only my Characters count: 2 of mine plus 3 opposing Characters is still not 3', () => {
    const g = block({ don: 1, others: [C29.c1], p2chars: [C29.c1, C29.c2, C29.c3] });
    expect(hand(g)).toEqual([]);
  });

  it('it does not draw when Killer is attacked-over without blocking (no [On Block])', () => {
    const g = theirs(
      L29.croc,
      { characters: [{ card: ID, don: 1 }, C29.c1, C29.c2], deck: fill(TOP, 15), hand: [] },
      {},
    );
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    expect(hand(g)).toEqual([]);
  });

  it('a different Blocker of mine blocking does not draw (the effect is on Killer only)', () => {
    const g = theirs(
      L29.croc,
      {
        characters: [{ card: ID, don: 1 }, C29.blockerFranky, C29.c2],
        deck: fill(TOP, 15),
        hand: [],
      },
      {},
    );
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: inst(g, 'p1', 'characters', C29.blockerFranky) });
    expect(hand(g)).toEqual([]);
  });
});
