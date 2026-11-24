/**
 * OP11-112 Megalo (Character, Yellow, cost 3, 2000, Counter +1000, {Animal}/{Fish-Man Island}, [Blocker]).
 *
 * Card text: "[Blocker] [Opponent's Turn] If your Leader is [Shirahoshi], this Character gains +4000 power."
 *
 * Rules: CR 10-2 ([Opponent's Turn] applies only during my opponent's turn), CR 8-2 (continuous),
 * CR 7-1 (battle: the attacker K.O.s a defender whose power is not above its own).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  kind,
  LD11,
  me,
  passCounter,
  SC11,
  them,
  trash,
} from './kit-op11c.ts';

const ID = 'OP11-112';

const power = (g: ReturnType<typeof me>) => g.power(at(g, 'p1', 'characters', ID));

describe('OP11-112 Megalo: +4000 power on my opponent’s turn with a [Shirahoshi] Leader', () => {
  it('has [Blocker]', () => {
    const g = me(LD11.shirahoshi, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('printed effect: 6000 power during my opponent’s turn with a [Shirahoshi] Leader', () => {
    const g = them(LD11.shirahoshi, { characters: [ID] });
    expect(power(g)).toBe(6000);
  });

  it('on my own turn it has its printed 2000', () => {
    const g = me(LD11.shirahoshi, { characters: [ID] });
    expect(power(g)).toBe(2000);
  });

  it('a Leader that is not [Shirahoshi] gets nothing on my opponent’s turn', () => {
    const g = them(LD11.plain, { characters: [ID] });
    expect(power(g)).toBe(2000);
  });

  it('blocking a 5000 attacker: 6000 power survives, no K.O.', () => {
    const g = them(LD11.shirahoshi, { characters: [ID] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    passCounter(g);
    expect(trash(g)).toEqual([]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('control: the same block with a non-[Shirahoshi] Leader K.O.s the 2000 Megalo', () => {
    const g = them(LD11.plain, { characters: [ID] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    passCounter(g);
    expect(trash(g)).toEqual([ID]);
  });

  it('a 7000 attacker still K.O.s a blocking Megalo (6000 < 7000)', () => {
    const g = them(LD11.shirahoshi, { characters: [ID] }, { characters: [SC11.r5] });
    attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    passCounter(g);
    expect(trash(g)).toEqual([ID]);
  });

  it('exactly equal power does not save it: a 6000 attacker K.O.s a 6000 Megalo', () => {
    const g = them(LD11.shirahoshi, { characters: [ID] }, { characters: [SC11.r4] });
    attack(g, at(g, 'p2', 'characters', SC11.r4), g.leader('p1'));
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    passCounter(g);
    expect(trash(g)).toEqual([ID]);
  });

  it('the bonus is not permanent: it is gone again on my own next turn', () => {
    const g = them(LD11.shirahoshi, { characters: [ID] });
    expect(power(g)).toBe(6000);
    act(g, { type: 'endTurn' });
    expect(kind(g)).toBe('main');
    expect(power(g)).toBe(2000);
  });
});
