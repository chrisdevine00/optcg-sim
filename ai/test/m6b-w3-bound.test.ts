/**
 * M6b wave 3 and the lethal bound (ai/src/search/lethal/bound.ts): every new script shape must
 * either be bounded or come back as "not classified" (the caller then searches), never be trusted
 * with a number that is too small.
 *  - `div` is bounded by its numerator (a division by 1 or more never grows it);
 *  - the player restriction `cannotSetDonActive` is not classified (it is an object form);
 *  - the opponent-side DON!! actions add nothing to what the attacker reaches;
 *  - the new event timings are event-driven autos (they may fire many times a turn).
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
const own = { from: 'characters', owner: 'you', pick: { upTo: 1 } };
const opp = { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } };
const act = (effect: unknown[]): Loose => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  oncePerTurn: true,
  effect,
});
const auto = (when: unknown, effect: unknown[]): Loose => ({
  id: 'w',
  kind: 'auto',
  when: [when],
  effect,
});

describe('M6b wave 3: lethal bound stays sound', () => {
  it('a division is bounded by its numerator, not by the "unknown number" ceiling', () => {
    const s = sc();
    const per5 = { mul: [{ div: [{ trash: 'you' }, 5] }, 1000] };
    expect(
      scanAbility(
        act([{ do: { power: { target: own, amount: per5, duration: 'thisTurn' } } }]),
        1,
        0,
        s,
      ),
    ).toBe(true);
    // 50 cards in a trash at most, as the numerator is: never the 100,000 of an unknown Num.
    expect(s.gainTotal).toBe(50 * 1000);
    const t = sc();
    scanAbility(
      act([
        {
          do: {
            power: { target: own, amount: { div: [{ count: own }, 2] }, duration: 'thisTurn' },
          },
        },
      ]),
      1,
      0,
      t,
    );
    expect(t.gainTotal).toBe(20);
  });

  it('cannotSetDonActive is not classified, so the solver searches', () => {
    const what = { cannotSetDonActive: { by: 'characterEffects' } };
    expect(
      scanAbility(
        act([{ do: { restrict: { target: 'you', what, duration: 'thisTurn' } } }]),
        1,
        0,
        sc(),
      ),
    ).toBe(false);
  });

  it('the opponent’s DON!! given or returned adds no power or attack for the attacker', () => {
    const s = sc();
    expect(
      scanAbility(
        act([
          { do: { giveDon: { n: 1, state: 'any', from: 'opponent', to: opp } } },
          { do: { returnDon: { n: 1, player: 'opponent', from: 'active' } } },
        ]),
        1,
        0,
        s,
      ),
    ).toBe(true);
    expect(s.gain).toBe(0);
    expect(s.gainTotal).toBe(0);
    expect(s.blockerLoss).toBe(0);
    expect(s.handLoss).toBe(0);
  });

  it('the new event timings count as event-driven autos (up to 10 firings a turn)', () => {
    const boost = [{ do: { power: { target: own, amount: 1000, duration: 'thisTurn' } } }];
    for (const when of [
      { event: 'trashedFromHand', owner: 'you' },
      { event: 'rested', owner: 'you' },
      { event: 'removed', owner: 'you' },
      { event: 'leftField', owner: 'you' },
    ]) {
      const s = sc();
      expect(scanAbility(auto(when, boost), 1, 0, s)).toBe(true);
      expect(s.gainTotal).toBe(10 * 1000);
    }
  });
});
