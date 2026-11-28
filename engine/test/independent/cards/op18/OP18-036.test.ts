/**
 * OP18-036 Monkey.D.Luffy (Green Character, cost 2, 0 power, Counter 2000, {Water Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[End of Your Turn] You may trash this Character: Draw 1 card and set your Leader as active."
 *
 * Reading: at the end of your turn, optional cost (trash this Character); then draw 1 and set your
 * Leader active. Not at the end of the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import { cardIds, endBattle, hand, kind, LC, mine, n, no, theirs, trash, yes } from './kit-c.ts';

const LUFFY = 'OP18-036';

function leaderAttacks(g: ReturnType<typeof mine>) {
  attack(g, g.leader('p1'), g.leader('p2'));
  endBattle(g);
}

describe('OP18-036 Luffy: [End of Your Turn] trash this: draw 1 and set your Leader active', () => {
  it('yes: Luffy is trashed, 1 card is drawn and the rested Leader is set active', () => {
    const g = mine(LC.luffy, { characters: [LUFFY] });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    yes(g, 'p1');
    expect(trash(g)).toEqual([LUFFY]);
    expect(n(g, 'p1', 'hand')).toBe(1);
    expect(n(g, 'p1', 'deck')).toBe(14);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('no: nothing is drawn, the Leader stays rested, Luffy stays', () => {
    const g = mine(LC.luffy, { characters: [LUFFY] });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    no(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([LUFFY]);
    expect(hand(g)).toEqual([]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('the draw still happens when the Leader is already active', () => {
    const g = mine(LC.luffy, { characters: [LUFFY] });
    act(g, { type: 'endTurn' });
    yes(g, 'p1');
    expect(n(g, 'p1', 'hand')).toBe(1);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('a rested Luffy can pay the cost too', () => {
    const g = mine(LC.luffy, { characters: [{ card: LUFFY, rested: true }] });
    leaderAttacks(g);
    act(g, { type: 'endTurn' });
    yes(g, 'p1');
    expect(trash(g)).toEqual([LUFFY]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('asked at the end of your turn, not during the Main Phase', () => {
    const g = mine(LC.luffy, { characters: [LUFFY] });
    expect(kind(g)).toBe('main');
    leaderAttacks(g);
    expect(kind(g)).toBe('main');
  });

  it('does not fire at the end of the opponent’s turn', () => {
    const g = theirs(LC.luffy, { characters: [LUFFY] });
    act(g, { type: 'endTurn' });
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([LUFFY]);
  });

  it('two Luffys: each can be used (two draws)', () => {
    const g = mine(LC.luffy, { characters: [LUFFY, LUFFY] });
    act(g, { type: 'endTurn' });
    for (let i = 0; i < 4 && kind(g) === 'order'; i++)
      act(
        g,
        g.legal().find((a) => a.type === 'order')!,
      );
    yes(g, 'p1');
    for (let i = 0; i < 4 && kind(g) === 'order'; i++)
      act(
        g,
        g.legal().find((a) => a.type === 'order')!,
      );
    if (kind(g) === 'optional') yes(g, 'p1');
    expect(n(g, 'p1', 'hand')).toBe(2);
  });
});
