/**
 * M6b wave 8a and the lethal bound (ai/src/search/lethal/bound.ts): the new cost `returnGivenDon`
 * (G70) is not one of the costs that limit a repeatable ability, so such an ability is searched
 * (`scanAbility` false), and the conditions `handTrashedThisTurn` (G69) and `attackerIs` (G71) are
 * only read by the engine: an ability that carries them is scanned by its effects as before.
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
const act = (effect: unknown[], cost?: unknown[], once = true): Loose => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  ...(once ? { oncePerTurn: true } : {}),
  ...(cost ? { cost } : {}),
  effect,
});

describe('M6b wave 8a: lethal bound stays sound', () => {
  it('a repeatable ability paid by returning given DON!! is not limited, so it is searched', () => {
    const cost = [{ returnGivenDon: 2 }];
    expect(scanAbility(act([{ do: { draw: 1 } }], cost, false), 1, 3, sc())).toBe(false);
  });

  it('a Once Per Turn ability with that cost is scanned by its effects (here nothing for the attacker)', () => {
    const cost = [{ returnGivenDon: 2 }];
    expect(scanAbility(act([{ do: { draw: 1 } }], cost, true), 1, 3, sc())).toBe(true);
  });

  it('conditions on the hand history or the attacker do not change how an effect is scanned', () => {
    const base = scanAbility(act([{ do: { draw: 1 } }]), 1, 3, sc());
    const withCond = {
      ...act([{ if: { attackerIs: { attribute: 'Slash' } }, then: [{ do: { draw: 1 } }] }]),
      conditions: [{ handTrashedThisTurn: 'you' }],
    };
    expect(scanAbility(withCond, 1, 3, sc())).toBe(base);
  });
});
