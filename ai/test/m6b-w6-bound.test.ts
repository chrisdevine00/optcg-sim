/**
 * M6b wave 6 and the lethal bound (ai/src/search/lethal/bound.ts): the new ops and forms are "not
 * classified" (the caller then searches) unless they are shown to add nothing for the attacker. The
 * opponent playing a card or adding DON!!, and the permanent "played rested", are not in the neutral
 * set; a place-this-card cost counts as taking the card off the board; the new timing is event-driven.
 */
import { SCRIPTS, type CardScript } from '@optcg/cards';
import { afterEach, describe, expect, it } from 'vitest';
import { bouncesOf, scanAbility } from '../src/search/lethal/bound.ts';

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
const act = (effect: unknown[], cost?: unknown[], once = true): Loose => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  ...(once ? { oncePerTurn: true } : {}),
  ...(cost ? { cost } : {}),
  effect,
});

describe('M6b wave 6: lethal bound stays sound', () => {
  it.each([
    [
      'your opponent plays a card from their hand',
      {
        play: {
          player: 'opponent',
          what: { from: 'hand', owner: 'opponent', chooser: 'opponent', pick: { upTo: 1 } },
        },
      },
    ],
    ['your opponent adds DON!!', { addDon: [{ n: 1, state: 'active' }], player: 'opponent' }],
  ])('%s is not classified, so the solver searches', (_name, action) => {
    expect(scanAbility(act([{ do: action }]), 1, 0, sc())).toBe(false);
  });

  it('your own play and your own DON!! are classified as before', () => {
    expect(
      scanAbility(
        act([
          { do: { play: { what: { from: 'hand', owner: 'you', pick: { upTo: 1 } } } } },
          { do: { addDon: [{ n: 1, state: 'active' }] } },
        ]),
        1,
        0,
        sc(),
      ),
    ).toBe(true);
  });

  it('the permanent "played rested" is not classified', () => {
    expect(
      scanAbility(
        { id: 'p', kind: 'permanent', apply: [{ playRested: { category: ['Character'] } }] },
        1,
        0,
        sc(),
      ),
    ).toBe(false);
  });

  it('an auto on the new timing is event-driven: it can fire many times, bounded by the cap', () => {
    const s = sc();
    expect(
      scanAbility(
        {
          id: 'w',
          kind: 'auto',
          when: [{ event: 'triggerActivated', by: 'opponent' }],
          effect: [{ do: { power: { target: own, amount: 1000, duration: 'thisTurn' } } }],
        },
        1,
        0,
        s,
      ),
    ).toBe(true);
    expect(s.gainTotal).toBe(10 * 1000);
  });

  it('a [Trigger] that adds its own card to the hand is a [Trigger]: it never fires on the attacker’s turn', () => {
    expect(
      scanAbility(
        {
          id: 't',
          kind: 'trigger',
          effect: [
            {
              do: {
                move: {
                  what: { from: 'self', owner: 'you', pick: { exactly: 1 } },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        },
        1,
        0,
        sc(),
      ),
    ).toBe(true);
  });

  it('a repeatable ability that places its own card at the deck bottom is not classified', () => {
    const cost = [
      {
        move: { from: 'self', owner: 'you', pick: { exactly: 1 } },
        to: { zone: 'deck', position: 'bottom' },
      },
    ];
    expect(scanAbility(act([{ do: { draw: 1 } }], cost, false), 1, 3, sc())).toBe(false);
  });

  describe('taking the card off the board', () => {
    const ID = 'ZZ99-001';
    afterEach(() => {
      Reflect.deleteProperty(SCRIPTS, ID);
    });
    const script = (cost: unknown[]): CardScript =>
      ({
        cardId: ID,
        textHash: 'x',
        verified: { source: 't', date: '2026-11-25' },
        abilities: [act([{ do: { draw: 1 } }], cost)],
      }) as unknown as CardScript;

    it('a place-this-card cost counts as a Character taken off the board, as a trash-this-card cost does', () => {
      (SCRIPTS as Record<string, CardScript>)[ID] = script([{ trashSelf: true }]);
      const trashed = bouncesOf(ID, 0, false);
      (SCRIPTS as Record<string, CardScript>)[ID] = script([
        {
          move: { from: 'self', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'deck', position: 'bottom' },
        },
      ]);
      expect(bouncesOf(ID, 0, false)).toBe(trashed);
      expect(trashed).toBeGreaterThan(0);
    });
  });
});
