/**
 * M6b wave 8a, G70: the cost "return N total of your currently given DON!! cards to your cost area
 * rested" (ST28-004 Kouzuki Momonosuke). The DON!! leave the cards they are given to (the player
 * chooses which, several cards may give) and go rested to the cost area; they stay on the field,
 * so the DON!! deck does not change and no `donReturned` watcher fires.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  expectDecision,
  game,
  hand,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid, main, offered, run } from '../m6b-w1/probe.ts';

const probe = (n: unknown = 2) =>
  main([{ do: { draw: 1 } }] as never, [{ returnGivenDon: n }] as never, { oncePerTurn: true });

/** p1: the Leader holds `leader` DON!!, BLUE `blue`, V.c1 `c1`; 1 active and 1 rested in the cost area. */
const mk = (leader: number, blue: number, c1 = 0) => {
  const g = game(
    {
      leader: { card: PLAIN_PURPLE, don: leader },
      characters: [
        { card: BLUE, don: blue },
        { card: V.c1, don: c1 },
      ],
      costArea: { active: 1, rested: 1 },
    },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [probe()]);
  return g;
};
const given = (g: ReturnType<typeof mk>) => ({
  leader: g.card(g.leader('p1')).don,
  blue: g.card(g.find('p1', 'characters', BLUE)).don,
  c1: g.card(g.find('p1', 'characters', V.c1)).don,
});

/** Answer the choice: one DON!! from each card named (a card twice gives two), in candidate (id) order. */
const takeFrom = (g: ReturnType<typeof mk>, cards: string[]) => {
  for (const card of [...cards].sort())
    g.act({ type: 'pick', choice: { from: 'given', card } as never });
};

describe('G70 return N total given DON!! to the cost area rested', () => {
  it('validates, and refuses the nonsense', () => {
    expectValid([probe(2)]);
    const bad = (n: unknown) =>
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        cost: [{ returnGivenDon: n }],
        effect: [{ do: { draw: 1 } }],
      });
    expect(bad(0)).not.toEqual([]);
    expect(bad(1.5)).not.toEqual([]);
    expect(bad('all')).not.toEqual([]);
    // Not a replacement payload: it asks which DON!!, which a payload does not.
    expect(
      errorsOf({
        id: 'r',
        kind: 'replacement',
        replaces: 'ko',
        instead: [{ returnGivenDon: 1 }],
      }),
    ).not.toEqual([]);
  });

  it('is payable only with N or more DON!! given to your cards (active and rested ones in the cost area do not count)', () => {
    expect(offered(mk(0, 0))).toBe(false);
    expect(offered(mk(1, 0))).toBe(false);
    expect(offered(mk(1, 1))).toBe(true); // 2 given in all, on two cards
    expect(offered(mk(2, 0))).toBe(true);
  });

  it('takes exactly the given DON!! when there is no choice: they go rested, nothing leaves the field', () => {
    const g = mk(1, 1);
    const before = don(g, 'p1');
    run(g);
    expect(dec(g)?.kind).toBe('main'); // no question: 2 given, 2 needed
    expect(given(g)).toEqual({ leader: 0, blue: 0, c1: 0 });
    expect(don(g, 'p1')).toMatchObject({
      active: before.active,
      rested: before.rested + 2,
      deck: before.deck, // not returned to the DON!! deck
    });
    expect(hand(g, 'p1')).toHaveLength(1); // the effect ran
  });

  it('asks which when there are more given than needed: any split of the N', () => {
    const g = mk(2, 1);
    run(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.min).toBe(2);
    expect(d.max).toBe(2);
    takeFrom(g, [g.leader('p1'), g.find('p1', 'characters', BLUE)]);
    expect(given(g)).toEqual({ leader: 1, blue: 0, c1: 0 });
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3 });

    const two = mk(2, 1);
    run(two);
    takeFrom(two, [two.leader('p1'), two.leader('p1')]);
    expect(given(two)).toEqual({ leader: 0, blue: 1, c1: 0 }); // both from one card
  });

  it('is not "returned": no donReturned watcher fires', () => {
    const g = mk(1, 1);
    const watcher = {
      id: 'w',
      kind: 'auto',
      when: [{ event: 'donReturned', owner: 'you' }],
      effect: [{ do: { draw: 1 } }],
    } as Ability;
    expectValid([watcher]);
    g.state = withAbilities(g.state, V.c1, [watcher]);
    run(g);
    expect(hand(g, 'p1')).toHaveLength(1); // only the probe's own draw
  });
});
