/**
 * M6b wave 4 and the lethal bound (ai/src/search/lethal/bound.ts): `damage`, `winGame`, Life moved to
 * the trash, a swap of base power, "can also attack active Characters" and a replacement created for
 * the turn change lethal arithmetic or the defence the bound models. None may be trusted with a number
 * that is too small: each comes back "not classified" (the caller then searches), and the shapes that
 * add nothing for the attacker are bounded.
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

describe('M6b wave 4: lethal bound stays sound', () => {
  it.each([
    ['damage to the opponent', { damage: { player: 'opponent', n: 1 } }],
    ['winGame', { winGame: true }],
    [
      'swapBasePower',
      {
        swapBasePower: {
          a: { from: 'leader', owner: 'you', pick: { exactly: 1 } },
          b: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
          duration: 'thisTurn',
        },
      },
    ],
    ['canAttackActive', { canAttackActive: { target: own, duration: 'thisTurn' } }],
    [
      'addReplacement',
      {
        addReplacement: {
          replaces: { ko: { from: 'characters', owner: 'you' }, cause: 'battle' },
          optional: true,
          instead: [{ returnDon: 1 }],
          duration: 'thisTurn',
        },
      },
    ],
    [
      'the opponent’s Life to the trash',
      {
        move: {
          what: { from: 'lifeTop', owner: 'opponent', pick: { exactly: 1 } },
          to: { zone: 'trash' },
        },
      },
    ],
    [
      'each player’s Life to the trash',
      {
        move: {
          what: { from: 'lifeTop', owner: 'any', pick: { exactly: 1 } },
          to: { zone: 'trash' },
        },
      },
    ],
  ])('%s is not classified, so the solver searches', (_name, action) => {
    expect(scanAbility(act([{ do: action }]), 1, 0, sc())).toBe(false);
  });

  it('damage or a win inside a branch or an auto is still found', () => {
    expect(
      scanAbility(act([{ if: { yourTurn: true }, then: [{ do: { winGame: true } }] }]), 1, 0, sc()),
    ).toBe(false);
    expect(
      scanAbility(
        {
          id: 'w',
          kind: 'auto',
          when: [{ event: 'blockerActivated', by: 'opponent' }],
          effect: [{ do: { winGame: true } }],
        },
        1,
        0,
        sc(),
      ),
    ).toBe(false);
  });

  it('a look at the opponent’s deck changes nothing for the attacker', () => {
    const s = sc();
    expect(
      scanAbility(
        act([{ do: { lookAtTop: { n: 1, player: 'opponent', take: [], rest: 'stay' } } }]),
        1,
        0,
        s,
      ),
    ).toBe(true);
    expect(s.gain + s.gainTotal + s.handLoss + s.blockerLoss).toBe(0);
  });

  it('a Life cost on your own Life does not hide the power the ability gives', () => {
    const s = sc();
    expect(
      scanAbility(
        act(
          [{ do: { power: { target: own, amount: 2000, duration: 'thisTurn' } } }],
          [{ trashLife: 1 }],
        ),
        1,
        0,
        s,
      ),
    ).toBe(true);
    expect(s.gainTotal).toBe(2000);
  });

  it('an amount read per target is bounded by the 10 DON!! a player owns', () => {
    const s = sc();
    expect(
      scanAbility(
        act([
          {
            do: {
              power: {
                target: own,
                amount: { mul: [{ donGivenToTarget: true }, 1000] },
                duration: 'thisTurn',
              },
            },
          },
        ]),
        1,
        0,
        s,
      ),
    ).toBe(true);
    expect(s.gainTotal).toBe(10 * 1000);
  });

  it('the koed watcher on either side is an event-driven auto (up to 10 firings a turn)', () => {
    const s = sc();
    expect(
      scanAbility(
        {
          id: 'w',
          kind: 'auto',
          when: [{ event: 'koed', owner: 'opponent', filter: { category: ['Character'] } }],
          effect: [{ do: { power: { target: own, amount: 1000, duration: 'thisTurn' } } }],
        },
        1,
        0,
        s,
      ),
    ).toBe(true);
    expect(s.gainTotal).toBe(10 * 1000);
  });
});
