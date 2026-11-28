/**
 * OP18-025 Gonbe (Green Character, cost 1, 0 power, {Animal}/{Water Seven}).
 *
 * Card text (cards/data):
 *   "[End of Your Turn] If this Character is rested, set your Leader as active."
 *
 * Reading: mandatory, no cost. At the end of your turn, if Gonbe is rested then, your Leader is set
 * active. Does not fire at the end of the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import { at, endBattle, kind, LC, mine, theirs, VC } from './kit-c.ts';

const GONBE = 'OP18-025';

function leaderAttacks(g: ReturnType<typeof mine>) {
  attack(g, g.leader('p1'), g.leader('p2'));
  endBattle(g);
  expect(g.card(g.leader('p1')).rested).toBe(true);
}

describe('OP18-025 Gonbe: [End of Your Turn] if rested, set your Leader as active', () => {
  it('rested Gonbe: the rested Leader is set active at the end of the turn, without a prompt', () => {
    const g = mine(LC.luffy, { characters: [{ card: GONBE, rested: true }] });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    expect(kind(g)).not.toBe('optional');
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('active Gonbe: the Leader stays rested', () => {
    const g = mine(LC.luffy, { characters: [GONBE] });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('Gonbe that attacked (and so is rested) counts', () => {
    const g = mine(LC.luffy, { characters: [GONBE] });
    attack(g, at(g, 'p1', 'characters', GONBE), g.leader('p2'));
    endBattle(g);
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('the Leader is active at the end of the turn when it was already active: nothing breaks', () => {
    const g = mine(LC.luffy, { characters: [{ card: GONBE, rested: true }] });
    act(g, { type: 'endTurn' });
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('it does not fire at the end of the opponent’s turn', () => {
    const g = theirs(LC.luffy, { characters: [{ card: GONBE, rested: true }] });
    act(g, { type: 'endTurn' });
    expect(g.eventsOfType('EffectActivated').filter((e) => e.card === GONBE)).toHaveLength(0);
  });

  it('it does fire (an effect event) at the end of your own turn', () => {
    const g = mine(LC.luffy, { characters: [{ card: GONBE, rested: true }] });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    expect(g.eventsOfType('EffectActivated').filter((e) => e.card === GONBE)).toHaveLength(1);
  });

  it('only the Leader is set active, not other rested Characters', () => {
    const g = mine(LC.luffy, {
      characters: [
        { card: GONBE, rested: true },
        { card: VC.marco3, rested: true },
      ],
    });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    expect(g.card(at(g, 'p1', 'characters', VC.marco3)).rested).toBe(true);
  });
});
