/**
 * OP18-033 Banban (Green Character, cost 2, 0 power, {Water Seven}).
 *
 * Card text (cards/data):
 *   "[Blocker]
 *    [End of Your Turn] You may trash this Character: Set up to 1 of your Characters as active."
 *
 * Reading: Blocker. At the end of your turn, optionally trash Banban, then set "up to 1" of your
 * (other, since Banban is trashed) Characters active. Characters only: not the Leader.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers } from '../../helpers.ts';
import {
  at,
  cardIds,
  kind,
  kw,
  LC,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  theirs,
  trash,
  VC,
  yes,
  type Chars,
} from './kit-c.ts';

const BANBAN = 'OP18-033';

function endWith(chars: Chars, leaderRested = false) {
  const g = mine(leaderRested ? { card: LC.luffy, rested: true } : LC.luffy, { characters: chars });
  act(g, { type: 'endTurn' });
  return g;
}

describe('OP18-033 Banban: [Blocker] and [End of Your Turn] trash this: set up to 1 Character active', () => {
  it('has Blocker', () => {
    const g = theirs(LC.luffy, { characters: [BANBAN] }, { characters: [VC.marco3] });
    expect(kw(g, at(g, 'p1', 'characters', BANBAN))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', VC.marco3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', BANBAN)]);
  });

  it('yes: Banban is trashed and the chosen rested Character is set active', () => {
    const g = endWith([BANBAN, { card: VC.marco3, rested: true }]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickCards(g, [VC.marco3]);
    expect(g.card(at(g, 'p1', 'characters', VC.marco3)).rested).toBe(false);
    expect(trash(g)).toEqual([BANBAN]);
  });

  it('no: Banban stays and the rested Character stays rested', () => {
    const g = endWith([BANBAN, { card: VC.marco3, rested: true }]);
    no(g, 'p1');
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([BANBAN, VC.marco3].sort());
    expect(g.card(at(g, 'p1', 'characters', VC.marco3)).rested).toBe(true);
  });

  it('only Characters are offered, not the Leader', () => {
    const g = endWith([BANBAN, { card: VC.marco3, rested: true }], true);
    yes(g, 'p1');
    expect(offeredIds(g)).toEqual([VC.marco3]);
    pickCards(g, [VC.marco3]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('"up to 1": may set nothing active (Banban is still trashed)', () => {
    const g = endWith([BANBAN, { card: VC.marco3, rested: true }]);
    yes(g, 'p1');
    none(g);
    expect(trash(g)).toEqual([BANBAN]);
    expect(g.card(at(g, 'p1', 'characters', VC.marco3)).rested).toBe(true);
  });

  it('only one of two rested Characters is set active', () => {
    const g = endWith([BANBAN, { card: VC.marco3, rested: true }, { card: VC.sai2, rested: true }]);
    yes(g, 'p1');
    pickCards(g, [VC.sai2]);
    expect(g.card(at(g, 'p1', 'characters', VC.sai2)).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', VC.marco3)).rested).toBe(true);
  });

  it('does not fire at the end of the opponent’s turn', () => {
    const g = theirs(LC.luffy, { characters: [BANBAN] });
    act(g, { type: 'endTurn' });
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([BANBAN]);
  });
});
