/**
 * EB05-043 Perona (Character, Black, cost 4, 5000, Counter +2000, {Thriller Bark Pirates}).
 *
 * Card text: "[On K.O.] K.O. or rest up to 1 of your opponent's Characters with a cost of 6 or less."
 *
 * Rules: [On K.O.] fires when this Character is K.O.'d, by battle or by an effect (CR 8-1-3-1),
 * and not when it leaves the field another way (RL-15: bounce is not a K.O.). CR 8-4-4-1 ("up to"
 * may choose 0). Choose K.O. or rest first (M6b-Q23); the engine's encoding is left open, so tests
 * assert the reachable outcomes.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock } from '../../helpers.ts';
import {
  BLUE,
  CH,
  chars,
  cardIds,
  decision,
  kind,
  LD,
  mine,
  outcomes,
  play,
  side,
  theirTurn,
  trash,
  choose,
} from './kit-b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'EB05-043';
/** OP06-058 Gravity Blade Raging Tiger (Navy Event, cost 7): place up to 2 Characters (cost <= 6) at the bottom of the owner's deck. */
const GRAVITY = 'OP06-058';
/** EB01-059 Kingdom Come (Event, cost 6): [Main] K.O. up to 1 of your opponent's Characters (then trash Life down to 1). */
const KINGDOM = 'EB01-059';

/** p2's turn; p2's Marco attacks my rested Perona and K.O.s it. */
function koInBattle(opp: string[]) {
  const g = theirTurn(
    side(LD.shc, BLUE, { characters: [{ card: ID, rested: true }] }),
    side(LD.shc, 'P-015', { characters: [CH.marco, ...opp] }),
  );
  attack(g, g.find('p2', 'characters', CH.marco), g.find('p1', 'characters', ID));
  passBlock(g);
  if (kind(g) === 'counter') g.act({ type: 'endCounter' });
  return g;
}

/** What happened to p2's Characters: state per card plus p2's trash. */
function fp(g: TestGame): string {
  const field = g
    .zone('p2', 'characters')
    .map((c) => `${c.card}${c.rested ? 'R' : 'A'}`)
    .sort()
    .join(',');
  return `${field}|${trash(g, 'p2').join(',')}`;
}

const THREE = [CH.kingdew, CH.thatch, CH.littleOars];

describe('EB05-043 Perona [On K.O.]: K.O. or rest up to 1 opposing Character with cost <= 6', () => {
  it('after Perona is K.O.’d in battle, a cost-5 Character can be K.O.’d', () => {
    const g = koInBattle(THREE);
    expect(chars(g)).toEqual([]);
    const sets = outcomes(g, 'p1', fp);
    expect([...sets].some((s) => s.split('|')[1]!.includes(CH.kingdew))).toBe(true);
  });

  it('or it can be rested instead (still on the field, rested)', () => {
    const g = koInBattle(THREE);
    const sets = outcomes(g, 'p1', fp);
    expect(
      [...sets].some((s) => s.includes(`${CH.kingdew}R`) && !s.split('|')[1]!.includes(CH.kingdew)),
    ).toBe(true);
  });

  it('boundary: a cost-6 Character is a legal target; a cost-7 one is never touched', () => {
    const g = koInBattle(THREE);
    const sets = [...outcomes(g, 'p1', fp)];
    expect(sets.some((s) => s.split('|')[1]!.includes(CH.thatch))).toBe(true);
    expect(sets.some((s) => s.includes(`${CH.thatch}R`))).toBe(true);
    for (const s of sets) {
      expect(s.split('|')[1]!.includes(CH.littleOars)).toBe(false);
      expect(s.includes(`${CH.littleOars}R`)).toBe(false);
    }
  });

  it('"up to 1": choosing nothing is possible, and never more than one Character is affected', () => {
    const g = koInBattle(THREE);
    const sets = [...outcomes(g, 'p1', fp)];
    expect(
      sets.some((s) => s === `${CH.marco}R,${CH.kingdew}A,${CH.thatch}A,${CH.littleOars}A|`),
    ).toBe(true);
    for (const s of sets) {
      const [field, tr] = s.split('|') as [string, string];
      const trashed = tr.split(',').filter(Boolean).length;
      const rested = field
        .split(',')
        .filter((c) => c.endsWith('R') && !c.startsWith(CH.marco)).length;
      expect(trashed + rested).toBeLessThanOrEqual(1);
    }
  });

  it('with a cost-7 Character next to the attacker, only the attacker can be affected', () => {
    const g = koInBattle([CH.littleOars]);
    const sets = [...outcomes(g, 'p1', fp)];
    for (const s of sets) expect(s.includes(`${CH.littleOars}A`)).toBe(true);
    expect(sets.some((s) => s.split('|')[1]!.includes(CH.marco))).toBe(true);
  });

  it('the attacker itself (cost 3) is a legal target as well', () => {
    const g = koInBattle([]);
    const sets = [...outcomes(g, 'p1', fp)];
    expect(sets.some((s) => s.split('|')[1]!.includes(CH.marco))).toBe(true);
  });

  it('it also fires when an effect K.O.s Perona (EB01-059 Kingdom Come)', () => {
    const g = theirTurn(
      side(LD.shc, BLUE, { characters: [ID] }),
      side(LD.shc, 'P-015', {
        hand: [KINGDOM],
        characters: THREE,
        costArea: { active: 10, rested: 0 },
      }),
    );
    play(g, g.find('p2', 'hand', KINGDOM));
    choose(g, [g.find('p1', 'characters', ID)]);
    expect(chars(g)).toEqual([]);
    const d = decision(g);
    expect(d?.player).toBe('p1');
    const sets = [...outcomes(g, 'p1', fp)];
    expect(sets.some((s) => s.split('|')[1]!.includes(CH.kingdew))).toBe(true);
  });

  it('RL-15: placing Perona at the bottom of the deck is not a K.O., so nothing happens to the opponent', () => {
    const g = mine(LD.navy, { hand: [GRAVITY], characters: [ID] }, { characters: THREE });
    play(g, g.find('p1', 'hand', GRAVITY));
    choose(g, [g.find('p1', 'characters', ID)]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([GRAVITY]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([...THREE].sort());
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('a Perona that does not leave the field does not trigger: surviving a battle changes nothing', () => {
    const g = theirTurn(
      side(LD.shc, BLUE, {
        characters: [
          { card: CH.littleOars, rested: true },
          { card: ID, rested: true },
        ],
      }),
      side(LD.shc, 'P-015', { characters: [CH.sai, ...THREE] }),
    );
    attack(g, g.find('p2', 'characters', CH.sai), g.find('p1', 'characters', ID));
    passBlock(g);
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    // Sai (4000) loses to Perona (5000): Perona survives, no [On K.O.].
    expect(chars(g)).toContain(ID);
    expect(kind(g)).toBe('main');
  });
});
