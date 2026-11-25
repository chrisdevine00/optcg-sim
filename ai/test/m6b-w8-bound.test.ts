/**
 * M6b wave 8 and the lethal bound (ai/src/search/lethal/bound.ts): `activate` of an Event chosen by a
 * selector (D2) runs another card's [Main] that the scan of this card's script does not see, so
 * `winsByEffect` counts it (the solver then searches) and `scanAbility` does not classify it. The
 * activation of the card's own ability is unchanged. `delayed` at the opponent's next Main Phase (D8)
 * and the event's subject (D9) add nothing the scan did not already read.
 */
import { describe, expect, it } from 'vitest';
import { SCRIPTED_IDS, SCRIPTS } from '@optcg/cards';
import { scanAbility, winsByEffect } from '../src/search/lethal/bound.ts';

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
const act = (effect: unknown[]): Loose => ({
  id: 'a',
  kind: 'activate',
  when: 'activateMain',
  oncePerTurn: true,
  effect,
});
const ofHand = {
  from: 'hand',
  owner: 'you',
  filter: { category: ['Event'] },
  pick: { upTo: 1 },
};

function plant(id: string, effect: unknown[]): void {
  (SCRIPTS as Record<string, unknown>)[id] = {
    cardId: id,
    textHash: 'x',
    verified: { source: 't', date: '2026-11-25' },
    abilities: [act(effect)],
  };
  (SCRIPTED_IDS as Set<string>).add(id);
}

describe('M6b wave 8: lethal bound stays sound', () => {
  it('activating an Event from the hand or trash is not classified, so it is searched', () => {
    expect(
      scanAbility(act([{ do: { activate: { ability: 'main', of: ofHand } } }]), 1, 0, sc()),
    ).toBe(false);
  });

  it('winsByEffect counts an activated Event, not the card’s own activation', () => {
    plant('EB01-019', [{ do: { activate: { ability: 'main', of: ofHand } } }]);
    plant('EB01-020', [{ do: { activate: { ability: 'main', of: 'self' } } }]);
    expect(winsByEffect('EB01-019')).toBe(true);
    expect(winsByEffect('EB01-020')).toBe(false);
  });

  it('a delayed effect at the opponent’s next Main Phase is scanned as its body', () => {
    const s = sc();
    const rest = { do: { rest: { from: 'donCostArea', owner: 'opponent', pick: { exactly: 1 } } } };
    expect(
      scanAbility(act([{ delayed: { at: 'startOfOpponentsNextMainPhase' }, do: [rest] }]), 1, 0, s),
    ).toBe(true);
  });

  it('a grant to the event’s subject is the same grant as before', () => {
    const subjectRush = {
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
    };
    expect(scanAbility(subjectRush, 1, 0, sc())).toBe(true);
  });
});
