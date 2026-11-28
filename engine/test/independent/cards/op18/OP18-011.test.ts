/**
 * OP18-011 Nefeltari Vivi (Red Character, cost 2, 0 power, {Alabasta}).
 *
 * Card text (cards/data):
 *   "All of your Characters with both the {Animal} and {Alabasta} types gain +1000 power.
 *    [Opponent's Turn] This Character gains [Blocker] and +6000 power."
 *
 * Reading: line 1 is continuous (either turn), your own {Animal}+{Alabasta} Characters only (Vivi
 * herself has {Alabasta} only). Line 2 applies only during the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers } from '../../helpers.ts';
import { at, cardIds, endBattle, kw, LC, mine, passBlock, theirs, VC } from './kit-c.ts';

const VIVI = 'OP18-011';

describe('OP18-011 Vivi: {Animal}+{Alabasta} Characters get +1000', () => {
  it('on your turn a Karoo ({Animal}/{Alabasta}) has +1000', () => {
    const g = mine(LC.luffy, { characters: [VIVI, VC.karoo1] });
    expect(g.power(at(g, 'p1', 'characters', VC.karoo1))).toBe(4000);
  });

  it('also on the opponent’s turn (the first line has no turn condition)', () => {
    const g = theirs(LC.luffy, { characters: [VIVI, VC.karoo1] });
    expect(g.power(at(g, 'p1', 'characters', VC.karoo1))).toBe(4000);
  });

  it('two Vivis stack: +2000', () => {
    const g = mine(LC.luffy, { characters: [VIVI, VIVI, VC.karoo1] });
    expect(g.power(at(g, 'p1', 'characters', VC.karoo1))).toBe(5000);
  });

  it('a Character with only {Alabasta} (Sanji) or only {Animal} (Momoo) gets nothing', () => {
    const g = mine(LC.luffy, { characters: [VIVI, VC.sanji1, VC.momoo2] });
    expect(g.power(at(g, 'p1', 'characters', VC.sanji1))).toBe(3000);
    expect(g.power(at(g, 'p1', 'characters', VC.momoo2))).toBe(4000);
  });

  it('Vivi herself ({Alabasta} only) gets no +1000 on your turn: 0 power', () => {
    const g = mine(LC.luffy, { characters: [VIVI] });
    expect(g.power(at(g, 'p1', 'characters', VIVI))).toBe(0);
  });

  it('the opponent’s {Animal}/{Alabasta} Characters get nothing', () => {
    const g = mine(LC.luffy, { characters: [VIVI] }, { characters: [VC.karoo1] });
    expect(g.power(at(g, 'p2', 'characters', VC.karoo1))).toBe(3000);
  });
});

describe('OP18-011 Vivi: [Opponent’s Turn] Blocker and +6000 power', () => {
  it('on the opponent’s turn: Blocker and 6000 power', () => {
    const g = theirs(LC.luffy, { characters: [VIVI] });
    const v = at(g, 'p1', 'characters', VIVI);
    expect(kw(g, v)).toContain('Blocker');
    expect(g.power(v)).toBe(6000);
  });

  it('on your turn: no Blocker and 0 power', () => {
    const g = mine(LC.luffy, { characters: [VIVI] });
    const v = at(g, 'p1', 'characters', VIVI);
    expect(kw(g, v)).not.toContain('Blocker');
    expect(g.power(v)).toBe(0);
  });

  it('it can block an attack on the Leader and survives a 5000 power attacker', () => {
    const g = theirs(LC.luffy, { characters: [VIVI] }, { characters: [VC.marco3] });
    attack(g, at(g, 'p2', 'characters', VC.marco3), g.leader('p1'));
    const v = at(g, 'p1', 'characters', VIVI);
    expect(blockers(g)).toEqual([v]);
    act(g, { type: 'block', blocker: v });
    endBattle(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VIVI]);
    expect(g.life('p1')).toBe(4);
  });

  it('a 6000 power attacker K.O.s it (6000 vs 6000) when it blocks', () => {
    const g = theirs(LC.luffy, { characters: [VIVI] }, { characters: [VC.hajrudin4] });
    attack(g, at(g, 'p2', 'characters', VC.hajrudin4), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', VIVI) });
    endBattle(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    void passBlock;
  });
});
