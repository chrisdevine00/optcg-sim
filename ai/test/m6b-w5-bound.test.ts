/**
 * M6b wave 5 and the lethal bound (ai/src/search/lethal/bound.ts): the new ops and forms are
 * "not classified" (the caller then searches) unless they are shown to add nothing for the attacker,
 * and the new numbers are bounded. `turnLifeFaceDown`, `chooseNumber`, a held-back DON!! count, a
 * source-filtered K.O. protection and an attack-target bar are not in the neutral set.
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
const act = (effect: unknown[], cost?: unknown[]): Loose => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  oncePerTurn: true,
  ...(cost ? { cost } : {}),
  effect,
});

describe('M6b wave 5: lethal bound stays sound', () => {
  it.each([
    ['turn every Life card face-down', { turnLifeFaceDown: 'all' }],
    ['choose a cost', { chooseNumber: { min: 0, max: 10, bind: 'c' } }],
    [
      'hold back the opponent’s rested DON!!',
      {
        skipRefresh: {
          from: 'donCostArea',
          owner: 'opponent',
          filter: { state: 'rested' },
          pick: { upTo: 1 },
        },
      },
    ],
    [
      'a source-filtered K.O. protection',
      {
        restrict: {
          target: own,
          what: { cannotBeKOd: { cause: 'battle', by: { attribute: 'Slash' } } },
          duration: 'thisTurn',
        },
      },
    ],
    [
      'a bar on attacking some targets',
      {
        restrict: {
          target: { from: 'leader', owner: 'you' },
          what: { cannotAttackTarget: { baseCost: { lte: 7 } } },
          duration: 'thisTurn',
        },
      },
    ],
    [
      'the top or bottom Life card to the hand',
      {
        move: {
          what: { from: 'lifeTopOrBottom', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'hand' },
        },
      },
    ],
  ])('%s is not classified, so the solver searches', (_name, action) => {
    expect(scanAbility(act([{ do: action }]), 1, 0, sc())).toBe(false);
  });

  it('an auto on a new timing is event-driven: it can fire many times, bounded by the cap', () => {
    const s = sc();
    expect(
      scanAbility(
        {
          id: 'w',
          kind: 'auto',
          when: [
            { event: 'damageTaken', owner: 'you' },
            { event: 'donReturned', owner: 'you', min: 2 },
          ],
          effect: [{ do: { power: { target: own, amount: 1000, duration: 'thisTurn' } } }],
        },
        1,
        0,
        s,
      ),
    ).toBe(true);
    expect(s.gainTotal).toBe(10 * 1000);
  });

  it('the new numbers are bounded, not left at the 100,000 ceiling', () => {
    const face = sc();
    scanAbility(
      act([
        {
          do: {
            power: {
              target: own,
              amount: { mul: [{ lifeFaceUp: 'you' }, 1000] },
              duration: 'thisTurn',
            },
          },
        },
      ]),
      1,
      0,
      face,
    );
    expect(face.gainTotal).toBe(6000);
    const chosen = sc();
    scanAbility(
      act([
        {
          do: {
            power: { target: own, amount: { mul: [{ chosen: 'c' }, 1000] }, duration: 'thisTurn' },
          },
        },
        { do: { chooseNumber: { min: 0, max: 10, bind: 'c' } } },
      ]),
      1,
      0,
      chosen,
    );
    // The scan reads the number first and then fails on `chooseNumber`: what it read is finite.
    expect(chosen.gainTotal).toBe(10_000);
  });

  it('revealing the opponent’s deck top changes nothing for the attacker', () => {
    const s = sc();
    expect(
      scanAbility(
        act([{ do: { reveal: { from: 'deckTop', n: 1, bind: 'r', player: 'opponent' } } }]),
        1,
        0,
        s,
      ),
    ).toBe(true);
    expect(s.gain + s.gainTotal + s.handLoss + s.blockerLoss).toBe(0);
  });

  it('a return-DON!! cost with a variable count does not make a repeatable ability look limited', () => {
    expect(
      scanAbility(
        {
          id: 'a',
          kind: 'activate',
          when: 'activateMain',
          cost: [{ returnDon: { atLeast: 1 } }],
          effect: [{ do: { draw: 1 } }],
        },
        1,
        3,
        sc(),
      ),
    ).toBe(false);
  });
});
