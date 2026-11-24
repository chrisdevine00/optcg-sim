/**
 * OP11-096 Ripper (Character, Black, cost 1, 1000, Counter +1000, {Navy}/{East Blue}).
 *
 * Card text: "If you have a black "Navy" type Character other than [Ripper], this Character gains
 * [Blocker]."
 *
 * Rules: CR 8-2 (a continuous effect is re-evaluated at all times), CR 2-4 (name/type/colour match),
 * CR 10-1-4 ([Blocker]).
 */
import { describe, expect, it } from 'vitest';
import { act, at, attack, blockers, kind, kw, LD11, me, SC11, them } from './kit-op11c.ts';

const ID = 'OP11-096';

const blocker = (g: ReturnType<typeof me>) =>
  kw(g, at(g, 'p1', 'characters', ID)).includes('Blocker');

describe('OP11-096 Ripper: gains [Blocker] while I have another black {Navy} Character', () => {
  it('printed effect: with a black {Navy} Character it has [Blocker]', () => {
    const g = me(LD11.plain, { characters: [ID, SC11.navyB3] });
    expect(blocker(g)).toBe(true);
  });

  it('alone it has no [Blocker]', () => {
    const g = me(LD11.plain, { characters: [ID] });
    expect(blocker(g)).toBe(false);
  });

  it('a non-black {Navy} Character does not count (green Koby)', () => {
    const g = me(LD11.plain, { characters: [ID, SC11.navyG4] });
    expect(blocker(g)).toBe(false);
  });

  it('a black Character that is not {Navy} does not count', () => {
    const g = me(LD11.plain, { characters: [ID, SC11.smile6] });
    expect(blocker(g)).toBe(false);
  });

  it('another [Ripper] does not count ("other than [Ripper]")', () => {
    const g = me(LD11.plain, { characters: [ID, ID] });
    expect(kw(g, at(g, 'p1', 'characters', ID, 0))).not.toContain('Blocker');
    expect(kw(g, at(g, 'p1', 'characters', ID, 1))).not.toContain('Blocker');
  });

  it('my black {Navy} Leader is not a Character and does not count', () => {
    const g = me(LD11.navy, { characters: [ID] });
    expect(blocker(g)).toBe(false);
  });

  it('a black {Navy} Character on the opponent’s side does not count', () => {
    const g = me(LD11.plain, { characters: [ID] }, { characters: [SC11.navyB3] });
    expect(blocker(g)).toBe(false);
  });

  it('with a black {Navy} Character it can actually block an attack on my Leader', () => {
    const g = them(
      LD11.plain,
      { characters: [ID, { card: SC11.navyB3, rested: true }] },
      { characters: [SC11.r5] },
    );
    attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
  });

  it('without a black {Navy} Character it cannot block', () => {
    const g = them(LD11.plain, { characters: [ID] }, { characters: [SC11.r5] });
    attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('the [Blocker] is lost when the black {Navy} Character is K.O.’d', () => {
    const g = them(
      LD11.plain,
      { characters: [ID, { card: SC11.navyB3, rested: true }] },
      { characters: [SC11.r5] },
    );
    expect(kw(g, at(g, 'p1', 'characters', ID))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', SC11.r5), at(g, 'p1', 'characters', SC11.navyB3));
    act(g, { type: 'block', blocker: null });
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(kw(g, at(g, 'p1', 'characters', ID))).not.toContain('Blocker');
  });
});
