/**
 * No script gates a decision on a hidden zone (cards/src/hidden-gate.ts, ADR 0005), over every
 * registered script, plus planted gates so the check itself can fail.
 */
import { describe, expect, it } from 'vitest';
import type { Ability, CardScript } from '../src/dsl.ts';
import { HIDDEN_GATE_ALLOWED, hiddenGateProblems } from '../src/hidden-gate.ts';
import { SCRIPTS } from '../effects/index.ts';

const all = Object.values(SCRIPTS).flatMap((s) => hiddenGateProblems(s));
const key = (g: { cardId: string; abilityId: string }) => `${g.cardId}/${g.abilityId}`;

describe('no decision is gated on a hidden zone', () => {
  it('every gate is fixed or allowlisted with a reason', () => {
    expect(all.filter((g) => !HIDDEN_GATE_ALLOWED[key(g)])).toEqual([]);
  });
  it('every allowlist entry still matches a gate and has a reason', () => {
    const live = new Set(all.map(key));
    for (const [k, why] of Object.entries(HIDDEN_GATE_ALLOWED)) {
      expect(live.has(k), `stale allowlist entry ${k}`).toBe(true);
      expect(why.length).toBeGreaterThan(10);
    }
  });
});

describe('the check fails on planted gates', () => {
  const inHand = { exists: { from: 'hand', owner: 'you', filter: { category: ['Event'] } } };
  const pick = { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { any: true } } } };
  const script = (ab: object): CardScript =>
    ({ cardId: 'T-1', abilities: [{ id: 'x', ...ab }] }) as unknown as CardScript;
  const auto = (extra: object, effect: object[] = [pick]): CardScript =>
    script({ kind: 'auto', when: ['onPlay'], effect, ...extra } as unknown as Ability);

  it('an `if` on a hidden condition around a pick', () => {
    expect(hiddenGateProblems(auto({}, [{ if: inHand, then: [pick] }]))).toHaveLength(1);
  });
  it('a public condition around a pick is fine', () => {
    const pub = { cmp: [{ hand: 'you' }, '>=', 1] };
    expect(hiddenGateProblems(auto({}, [{ if: pub, then: [pick] }]))).toEqual([]);
  });
  it('a hidden condition with no prompt in either branch is fine (public outcome)', () => {
    expect(hiddenGateProblems(auto({}, [{ if: inHand, then: [{ do: { draw: 1 } }] }]))).toEqual([]);
  });
  it('an `if` whose branches ask the same thing is fine', () => {
    expect(hiddenGateProblems(auto({}, [{ if: inHand, then: [pick], else: [pick] }]))).toEqual([]);
  });
  it('an auto with a hidden ability condition and a prompt', () => {
    expect(hiddenGateProblems(auto({ conditions: [inHand] }))).toHaveLength(1);
  });
  it('an auto with a hidden ability condition and no prompt is fine', () => {
    expect(hiddenGateProblems(auto({ conditions: [inHand] }, [{ do: { draw: 1 } }]))).toEqual([]);
  });
  it('a [Trigger] with a hidden condition', () => {
    expect(
      hiddenGateProblems(
        script({ kind: 'trigger', conditions: [inHand], effect: [{ do: { draw: 1 } }] }),
      ),
    ).toHaveLength(1);
  });
  it('a hidden forEach count around a prompt', () => {
    const n = { count: { from: 'hand', owner: 'you' } };
    expect(hiddenGateProblems(auto({}, [{ forEach: n, do: [pick] }]))).toHaveLength(1);
  });
});
