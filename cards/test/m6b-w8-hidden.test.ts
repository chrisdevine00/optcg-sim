/**
 * M6b wave 8: the hidden-zone classification (cards/src/hidden.ts) and the hidden-gate check
 * (cards/src/hidden-gate.ts) understand the new shapes. An Event activated from your hand reads a
 * hidden zone and its choice is a prompt; from your trash, or the card's own ability, it reads none. A
 * delayed effect at the opponent's next Main Phase reads what its body reads, and the event's subject
 * (a card on the field) reads none.
 */
import { describe, expect, it } from 'vitest';
import type { Ability } from '../src/dsl.ts';
import { hiddenGates, promptsOf } from '../src/hidden-gate.ts';
import { abilityReadsHiddenZone } from '../src/hidden.ts';

const act = (effect: object[], extra: object = {}): Ability =>
  ({ id: 'a', kind: 'activate', when: 'activateMain', effect, ...extra }) as unknown as Ability;
const event = (from: 'hand' | 'trash') => ({
  from,
  owner: 'you',
  filter: { category: ['Event'] },
  pick: { upTo: 1 },
});
const activate = (from: 'hand' | 'trash') => [
  { do: { activate: { ability: 'main', of: event(from) } } },
];

describe('wave 8 shapes and hidden zones', () => {
  it('an Event chosen from the hand reads a hidden zone; from the trash or the card itself, none', () => {
    expect(abilityReadsHiddenZone(act(activate('hand')))).toBe(true);
    expect(abilityReadsHiddenZone(act(activate('trash')))).toBe(false);
    expect(
      abilityReadsHiddenZone(act([{ do: { activate: { ability: 'main', of: 'self' } } }])),
    ).toBe(false);
  });

  it('the choice of the Event is a prompt (a hidden condition around it is a gate)', () => {
    expect(promptsOf(activate('hand' as const) as never)).toHaveLength(1);
    const gated = {
      id: 'g',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ exists: { from: 'hand', owner: 'you', filter: { category: ['Event'] } } }],
      effect: activate('hand'),
    } as unknown as Ability;
    expect(hiddenGates(gated)).toHaveLength(1);
    // The same condition with an effect that asks nothing is not one.
    expect(hiddenGates({ ...gated, effect: [{ do: { draw: 1 } }] } as unknown as Ability)).toEqual(
      [],
    );
  });

  it('a delayed effect at the opponent’s next Main Phase reads what its body reads', () => {
    const body = [
      { do: { rest: { from: 'donCostArea', owner: 'opponent', pick: { exactly: 1 } } } },
    ];
    expect(
      abilityReadsHiddenZone(act([{ delayed: { at: 'startOfOpponentsNextMainPhase' }, do: body }])),
    ).toBe(false);
  });

  it('the event’s subject on the field reads no hidden zone', () => {
    const w = {
      id: 'w',
      kind: 'auto',
      when: [{ event: 'cardPlayed', by: 'you', from: 'trash' }],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'characters', owner: 'you', lki: 'subject' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    } as unknown as Ability;
    expect(abilityReadsHiddenZone(w)).toBe(false);
  });
});
