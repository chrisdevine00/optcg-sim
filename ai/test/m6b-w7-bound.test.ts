/**
 * M6b wave 7 and the lethal bound (ai/src/search/lethal/bound.ts): a new op or form is "not
 * classified" (the caller then searches) unless it is shown to add nothing for the attacker. Look
 * at Life, move DON!!, redirect an attack, an attribute grant, a Character placed into a Life area
 * and the permanent negate are all outside the neutral set, so `scanAbility` returns false; a power
 * cost on the Leader makes a repeatable ability unlimited, so it is searched too.
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
const theirs = { from: 'characters', owner: 'opponent', pick: { upTo: 1 } };
const act = (effect: unknown[], cost?: unknown[], once = true): Loose => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  ...(once ? { oncePerTurn: true } : {}),
  ...(cost ? { cost } : {}),
  effect,
});

describe('M6b wave 7: lethal bound stays sound', () => {
  it.each([
    ['look at Life cards', { lookAtLife: { owner: 'any', n: 1, place: 'topOrBottom' } }],
    [
      'look at all of your Life cards',
      { lookAtLife: { owner: 'you', n: 'all', place: 'anyOrder' } },
    ],
    ['move DON!! between your cards', { moveDon: { n: 1, from: own, to: own } }],
    ['redirect an attack', { redirectAttack: { to: own } }],
    ['grant an attribute', { grant: { target: own, attribute: 'Slash', duration: 'thisTurn' } }],
    [
      'place a Character into a Life area',
      {
        move: {
          what: theirs,
          to: { zone: 'life', position: 'topOrBottom', faceUp: true },
        },
      },
    ],
  ])('%s is not classified, so the solver searches', (_name, action) => {
    expect(scanAbility(act([{ do: action }]), 1, 0, sc())).toBe(false);
  });

  it('a keyword grant and an ordinary move are classified as before', () => {
    expect(
      scanAbility(
        act([
          { do: { grant: { target: own, keyword: 'Rush', duration: 'thisTurn' } } },
          { do: { move: { what: own, to: { zone: 'hand' } } } },
        ]),
        1,
        0,
        sc(),
      ),
    ).toBe(true);
  });

  it('the permanent negate is not classified', () => {
    expect(
      scanAbility(
        {
          id: 'p',
          kind: 'permanent',
          apply: [{ negate: { target: { from: 'characters', owner: 'you' } } }],
        },
        1,
        0,
        sc(),
      ),
    ).toBe(false);
  });

  it('a repeatable ability paid with a power cost on the Leader is not limited, so it is searched', () => {
    const cost = [
      {
        power: {
          target: { from: 'leader', owner: 'you', pick: { exactly: 1 } },
          amount: -1000,
          duration: 'thisTurn',
        },
      },
    ];
    expect(scanAbility(act([{ do: { draw: 1 } }], cost, false), 1, 3, sc())).toBe(false);
  });

  it('a restriction on the player’s own Life moves adds nothing for the attacker', () => {
    expect(
      scanAbility(
        act([
          {
            do: {
              restrict: {
                target: 'you',
                what: 'cannotAddLifeToHandByOwnEffects',
                duration: 'thisTurn',
              },
            },
          },
        ]),
        1,
        0,
        sc(),
      ),
    ).toBe(true);
  });
});
