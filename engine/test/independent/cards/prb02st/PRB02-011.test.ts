/**
 * PRB02-011 Donquixote Doflamingo (Character, cost 5, 6000, Counter +1000, {Donquixote Pirates}/{The
 * Seven Warlords of the Sea}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] If your Leader is multicolored, add up to 1 DON!! card from your
 * DON!! deck and rest it."
 *
 * Rules: a multicolored Leader has two colours (CR 2-2-x). "Add up to 1" from the DON!! deck asks a
 * count, most first (E-Q11); the DON!! card is added to the cost area rested. An empty DON!! deck
 * adds nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMainOf,
  blockers,
  decision,
  donStr,
  kind,
  kw,
  LDP,
  mine,
  need,
  playRaw,
  theirs,
  don,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const DF = 'PRB02-011';

function play(leader: string, active = 5) {
  const g = mine(leader, { hand: [DF], costArea: { active, rested: 0 } });
  playRaw(g, DF);
  return g;
}

/** Answer the count question with `n` DON!!. */
function count(g: TestGame, n: 0 | 1) {
  const d = need(g, 'choose', 'p1');
  expect(d.purpose).toBe('mode');
  act(g, { type: 'pick', choice: { option: String(n) } });
}

describe('PRB02-011 Doflamingo: [Blocker]; [On Play] if Leader is multicolored, add up to 1 DON!! from the DON!! deck, rested', () => {
  it('printed values: cost 5, 6000 power, Counter +1000, [Blocker]', () => {
    const g = mine(LDP.multi, { characters: [DF] });
    const i = at(g, 'p1', 'characters', DF);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([5, 6000, 1000]);
    expect(kw(g, i)).toContain('Blocker');
  });

  it('multicolored Leader (Green/Red): adds 1 DON!! rested (cost area 5 rested -> 6 rested, 0 active) and the DON!! deck shrinks', () => {
    const g = play(LDP.multi);
    count(g, 1);
    expect(donStr(g, 'p1')).toBe('0/6/0');
    expect(don(g, 'p1').deck).toBe(4);
    expect(atMainOf(g)).toBe(true);
  });

  it('the added DON!! is rested, never active', () => {
    const g = play(LDP.multi);
    count(g, 1);
    expect(don(g, 'p1').active).toBe(0);
  });

  it('"up to 1": answering None adds nothing', () => {
    const g = play(LDP.multi);
    count(g, 0);
    expect(donStr(g, 'p1')).toBe('0/5/0');
    expect(atMainOf(g)).toBe(true);
  });

  it('a second multicolored Leader (Red/Black) also qualifies', () => {
    const g = play('OP02-002');
    count(g, 1);
    expect(donStr(g, 'p1')).toBe('0/6/0');
  });

  it('a single-colour Leader: nothing is added and nothing is asked', () => {
    const g = play(LDP.neutral);
    expect(kind(g)).toBe('main');
    expect(donStr(g, 'p1')).toBe('0/5/0');
  });

  it('only 1 DON!! is added even with plenty left in the DON!! deck (options are 1 or None)', () => {
    const g = play(LDP.multi, 2 + 3);
    const d = need(g, 'choose', 'p1');
    expect((d.options ?? []).map((o) => o.id).sort()).toEqual(['0', '1']);
  });

  it('with an empty DON!! deck (10 DON!! already in the cost area) nothing can be added', () => {
    const g = mine(LDP.multi, { hand: [DF], costArea: { active: 10, rested: 0 } });
    playRaw(g, DF);
    if (decision(g)?.kind === 'choose') count(g, 0);
    expect(donStr(g, 'p1')).toBe('5/5/0');
    expect(atMainOf(g)).toBe(true);
  });

  it('[Blocker]: it can block an attack on my Leader', () => {
    const g = theirs(LDP.multi, { characters: [DF] });
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', DF)]);
  });

  it('a Doflamingo already on the field does nothing on its own: no DON!! added at the start', () => {
    const g = mine(LDP.multi, { characters: [DF], costArea: { active: 5, rested: 0 } });
    expect(donStr(g, 'p1')).toBe('5/0/0');
    expect(kind(g)).toBe('main');
  });
});
