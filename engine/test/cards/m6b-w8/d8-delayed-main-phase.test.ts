/**
 * M6b wave 8, D8: a delayed effect at the start of the opponent's next Main Phase (PRB02-005
 * Monkey.D.Luffy: "your opponent rests 1 of their active DON!! cards at the start of their next Main
 * Phase"). The conditions written outside the `delayed` step are read when it is created: the official
 * PRB02 Q&A for PRB02-005 says the opponent still rests the DON!! with 8 or more at that Main Phase.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, internals, withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, dec, don, game, PLAIN_BLUE, PLAIN_PURPLE, payDon, V } from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

const restOne = {
  do: {
    rest: { from: 'donCostArea', owner: 'opponent', chooser: 'opponent', pick: { exactly: 1 } },
  },
};
/** "[Activate: Main] your opponent rests 1 of their active DON!! at the start of their next Main Phase." */
const delayedRest = (at: string = 'startOfOpponentsNextMainPhase', body: unknown[] = [restOne]) =>
  ({
    id: 'a',
    kind: 'activate',
    when: 'activateMain',
    effect: [{ delayed: { at }, do: body }],
  }) as unknown as Ability;

const mk = (ab: Ability = delayedRest(), p2: object = {}) => {
  const g = game(
    { leader: PLAIN_BLUE, characters: [BLUE], costArea: { active: 2, rested: 0 } },
    { leader: PLAIN_PURPLE, characters: [V.c2], costArea: { active: 5, rested: 0 }, ...p2 },
  );
  g.state = withAbilities(g.state, BLUE, [ab]);
  return g;
};
const run = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
const p2don = (g: ReturnType<typeof mk>) => don(g, 'p2');
const active = (g: ReturnType<typeof mk>) => internals(g.state).active;
/** The turn passes: p2's refresh, draw and DON!! Phase, then the delayed effect asks p2 which DON!! to rest. */
const passTurn = (g: ReturnType<typeof mk>) => {
  g.act({ type: 'endTurn' });
  payDon(g);
};

describe('D8 delayed at the start of the opponent’s next Main Phase', () => {
  it('validates; an unknown timing is refused', () => {
    expectValid([delayedRest()]);
    expect(errorsOf(delayedRest('startOfTheirNextTurn'))).not.toEqual([]);
  });

  it('does nothing now or at the end of this turn; rests the DON!! when their Main Phase starts', () => {
    const g = mk();
    run(g);
    expect(internals(g.state).delayed).toHaveLength(1);
    expect(p2don(g)).toMatchObject({ active: 5, rested: 0 });
    g.act({ type: 'endTurn' });
    // p2 (the one whose DON!! is rested) chooses: nothing was rested before their Main Phase began.
    expect(active(g)).toBe('p2');
    expect(dec(g)).toMatchObject({ kind: 'choose', player: 'p2' });
    expect(p2don(g)).toMatchObject({ active: 7, rested: 0 }); // refreshed, 2 added, nothing rested yet
    payDon(g);
    expect(dec(g)?.kind).toBe('main');
    expect(p2don(g)).toMatchObject({ active: 6, rested: 1 });
    expect(internals(g.state).delayed).toHaveLength(0);
  });

  it('happens once: it does not come back at p1’s own Main Phase or p2’s next turn', () => {
    const g = mk();
    run(g);
    passTurn(g);
    g.act({ type: 'endTurn' }); // p2 passes
    expect(active(g)).toBe('p1');
    expect(dec(g)?.kind).toBe('main'); // no prompt at p1's Main Phase
    g.act({ type: 'endTurn' });
    expect(dec(g)?.kind).toBe('main'); // none at p2's next one either
    expect(p2don(g).rested).toBe(0);
  });

  it('is read once at creation: the condition outside is not read again at the Main Phase', () => {
    // "If your opponent has 7 or less DON!! ... at the start of their next Main Phase": 7 now, 9 then
    // (8 or more still rests one, official PRB02 Q&A).
    const ab = {
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [
        {
          if: { cmp: [{ donOnField: 'opponent' }, '<=', 7] },
          then: [{ delayed: { at: 'startOfOpponentsNextMainPhase' }, do: [restOne] }],
        },
      ],
    } as unknown as Ability;
    const g = mk(ab, { costArea: { active: 7, rested: 0 } });
    run(g);
    passTurn(g);
    expect(p2don(g)).toMatchObject({ active: 8, rested: 1 });
  });

  it('is not stopped by its source leaving the field', () => {
    const g = mk();
    run(g);
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', BLUE),
      by: 'p2',
    }).state;
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(BLUE);
    passTurn(g);
    expect(p2don(g).rested).toBe(1);
  });
});
