/**
 * OP18-024 Kokoro (Green Character, cost 2, 0 power, {Merfolk}/{Water Seven}).
 *
 * Card text (cards/data):
 *   "[Blocker]
 *    [End of Your Turn] You may trash this Character: Set your Leader as active."
 *
 * Reading: Blocker; at the end of YOUR turn you may trash Kokoro to set your Leader active (so it
 * can defend nothing special but stays ready; the Leader is active during the opponent's turn).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers } from '../../helpers.ts';
import {
  at,
  cardIds,
  endBattle,
  kind,
  kw,
  LC,
  mine,
  need,
  no,
  theirs,
  trash,
  VC,
  yes,
} from './kit-c.ts';

const KOKORO = 'OP18-024';

/** p1's Leader attacks (and ends the turn rested). */
function leaderAttacks(g: ReturnType<typeof mine>) {
  attack(g, g.leader('p1'), g.leader('p2'));
  endBattle(g);
}

describe('OP18-024 Kokoro: [Blocker] and [End of Your Turn] trash this: set your Leader active', () => {
  it('has Blocker and can block', () => {
    const g = theirs(LC.luffy, { characters: [KOKORO] }, { characters: [VC.marco3] });
    expect(kw(g, at(g, 'p1', 'characters', KOKORO))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', VC.marco3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', KOKORO)]);
  });

  it('at the end of your turn: yes trashes Kokoro and sets the rested Leader active', () => {
    const g = mine(LC.luffy, { characters: [KOKORO] });
    leaderAttacks(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    act(g, { type: 'endTurn' });
    yes(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(trash(g)).toEqual([KOKORO]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('no: Kokoro stays and the Leader stays rested', () => {
    const g = mine(LC.luffy, { characters: [KOKORO] });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    no(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KOKORO]);
  });

  it('the prompt is asked at the end of your turn, not before it', () => {
    const g = mine(LC.luffy, { characters: [KOKORO] });
    expect(kind(g)).toBe('main');
    leaderAttacks(g);
    expect(kind(g)).toBe('main');
  });

  it('it does not fire at the end of the opponent’s turn', () => {
    const g = theirs(LC.luffy, { characters: [KOKORO] });
    act(g, { type: 'endTurn' });
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([KOKORO]);
  });

  it('a Kokoro that was rested can still be trashed as the cost', () => {
    const g = mine(LC.luffy, { characters: [{ card: KOKORO, rested: true }] });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('two Kokoros each get their own prompt at the end of the turn', () => {
    const g = mine(LC.luffy, { characters: [KOKORO, KOKORO] });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    // The first accepted use sets the Leader active; the second is still offered and may be declined.
    for (let i = 0; i < 3 && kind(g) === 'order'; i++)
      act(
        g,
        g.legal().find((a) => a.type === 'order')!,
      );
    yes(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });
});
