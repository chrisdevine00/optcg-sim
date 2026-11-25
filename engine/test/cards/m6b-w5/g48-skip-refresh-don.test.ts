/**
 * M6b wave 5, G48: `skipRefresh` for DON!! ("up to 1 of your opponent's rested DON!! cards will not
 * become active in your opponent's next Refresh Phase", OP10-033). Planted on vanilla cards; each
 * test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { internals, withAbilities } from '../../../src/testing.ts';
import { BLUE, don, game, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const skip = (over: object = {}) => ({
  do: {
    skipRefresh: {
      from: 'donCostArea',
      owner: 'opponent',
      filter: { state: 'rested' },
      pick: { upTo: 1 },
      ...over,
    },
  },
});
const mk = (rested: number, active = 1, effects: unknown[] = [skip()]) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [BLUE] },
    {
      leader: { card: PLAIN_BLUE, rested: true },
      characters: [{ card: PURPLE, rested: true }],
      costArea: { active, rested },
    },
  );
  g.state = withAbilities(g.state, BLUE, [main(effects as never)]);
  return g;
};
/** Run the effect, end p1's turn, and let p2 go through Refresh, Draw and DON!! to its Main Phase. */
const toNextRefresh = (g: ReturnType<typeof mk>) => {
  run(g);
  g.act({ type: 'endTurn' });
};

describe('G48 skipRefresh of DON!!', () => {
  it('validates, and refuses the nonsense', () => {
    main([skip()] as never);
    const bad = (e: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [e] });
    expect(bad(skip({ owner: 'you' }))).not.toEqual([]);
    expect(bad(skip({ filter: undefined }))).not.toEqual([]);
    expect(bad(skip({ filter: { state: 'active' } }))).not.toEqual([]);
    expect(bad(skip({ pick: undefined }))).not.toEqual([]);
    expect(bad(skip({ pick: { any: true } }))).not.toEqual([]);
    expect(bad(skip({ from: ['donCostArea', 'characters'] }))).not.toEqual([]);
  });

  it('1 of the opponent’s rested DON!! stays rested through their next Refresh Phase', () => {
    const g = mk(3);
    toNextRefresh(g);
    // p2: 1 active + 3 rested; one stays rested, two refresh, then the DON!! phase adds 2 active.
    expect(don(g, 'p2')).toMatchObject({ rested: 1, active: 1 + 2 + 2 });
  });

  it('without the effect all of them refresh (the control)', () => {
    const g = mk(3, 1, []);
    run(g);
    g.act({ type: 'endTurn' });
    expect(don(g, 'p2')).toMatchObject({ rested: 0, active: 1 + 3 + 2 });
  });

  it('the Leader and Characters still refresh, and the hold ends with that Refresh Phase', () => {
    const g = mk(2);
    toNextRefresh(g);
    expect(g.card(g.leader('p2')).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', PURPLE)).rested).toBe(false);
    expect(internals(g.state).mods.some((m) => m.kind === 'skipRefreshDon')).toBe(false);
    // p2 ends the turn: the next Refresh is normal. p1 goes, p2 rests DON!! is not needed to test.
    expect(don(g, 'p2').rested).toBe(1);
  });

  it('holds back as many as there are: none rested, nothing happens', () => {
    const g = mk(0);
    run(g);
    expect(internals(g.state).mods.some((m) => m.kind === 'skipRefreshDon')).toBe(false);
    g.act({ type: 'endTurn' });
    expect(don(g, 'p2').rested).toBe(0);
  });

  it('"up to 2" with 1 rested holds that 1', () => {
    const g = mk(1, 1, [skip({ pick: { upTo: 2 } })]);
    toNextRefresh(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 1 });
  });

  it('two effects hold back two', () => {
    const g = mk(3, 1, [skip(), skip()]);
    toNextRefresh(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, active: 1 + 1 + 2 });
  });

  it('does not touch the owner’s own refresh', () => {
    // p1 holds p2's DON!!, and p1's own rested DON!! still refresh at p1's next Refresh.
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], costArea: { active: 0, rested: 2 } },
      { leader: PLAIN_BLUE, costArea: { active: 0, rested: 2 } },
    );
    g.state = withAbilities(g.state, BLUE, [main([skip()] as never)]);
    run(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(don(g, 'p1').rested).toBe(0);
  });
});
