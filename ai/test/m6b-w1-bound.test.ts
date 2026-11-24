/**
 * M6b wave 1 and the lethal bound (ai/src/search/lethal/bound.ts): the bound is only sound if every
 * script shape either adds to what the attacker can reach or is reported as unclassified. A new
 * restriction that bars the blocking side must count as a Blocker lost; shapes the scan does not
 * know (the scoped restrictions, `mill`, `activate`) must come back as "not classified" so the
 * caller searches instead of trusting a bound.
 */
import { describe, expect, it } from 'vitest';
import { scanAbility } from '../src/search/lethal/bound.ts';

type Loose = Record<string, unknown>;
const sc = () => ({
  gain: 0,
  gainTotal: 0,
  addDonActive: 0,
  addDonRested: 0,
  giveDon: false,
  reachTrash: false,
  handLoss: 0,
  blockerLoss: 0,
  replay: 1,
});
const target = { from: 'characters', owner: 'opponent', pick: { upTo: 1 } };
const act = (effect: unknown[]): Loose => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  oncePerTurn: true,
  effect,
});

describe('M6b wave 1: lethal bound stays sound', () => {
  it('cannotActivateBlocker removes a Blocker from the defender (timed and permanent)', () => {
    const s = sc();
    const ok = scanAbility(
      act([{ do: { restrict: { target, what: 'cannotActivateBlocker', duration: 'thisTurn' } } }]),
      1,
      0,
      s,
    );
    expect(ok).toBe(true);
    expect(s.blockerLoss).toBe(1);

    const p = sc();
    scanAbility(
      {
        id: 'p',
        kind: 'permanent',
        apply: [{ restrict: { target, what: 'cannotActivateBlocker' } }],
      },
      1,
      0,
      p,
    );
    expect(p.blockerLoss).toBe(Infinity);
  });

  it('scoped restrictions, mill and activate of an own ability are not classified', () => {
    const unknown = (effect: unknown[]) => scanAbility(act(effect), 1, 0, sc());
    expect(
      unknown([
        {
          do: {
            restrict: { target, what: { cannotBeKOd: { cause: 'effect' } }, duration: 'thisTurn' },
          },
        },
      ]),
    ).toBe(false);
    expect(unknown([{ do: { mill: { player: 'opponent', n: 3 } } }])).toBe(false);
    expect(unknown([{ do: { activate: { ability: 'onKO', of: 'self' } } }])).toBe(false);
  });
});
