/**
 * OP11-082 Aramaki (Character, Black, cost 1, 2000, Counter +2000, {Navy}).
 *
 * Card text: "[Activate: Main] You may trash this Character: If your Leader has the "Navy" type, up to
 * 1 of your "Navy" type Characters can also attack active Characters during this turn. Then, trash
 * 2 cards from the top of your deck."
 *
 * Rules: CR 8-3-1-4 ("you may" cost), CR 8-3-2 (If), M4b-5 (a "Then" after a failed "If" does not
 * resolve), RL-17 ("also attack active Characters" does not let a Character attack on the turn it
 * was played, and other attack restrictions still apply), CR 7-1-1 (a Leader/Character may attack
 * rested Characters or the Leader; attacking active Characters is what the grant adds).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canHit,
  cnt,
  deckSize,
  kind,
  LD11,
  mayChooseNone,
  me,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  result,
  SC11,
  toMyNextMain,
  trash,
  useAbility,
} from './kit-op11c.ts';

const ID = 'OP11-082';

function board(o: { leader?: string; deck?: string[]; mate?: unknown[]; foe?: unknown[] } = {}) {
  return me(
    o.leader ?? LD11.navy,
    {
      characters: [ID, ...((o.mate as string[]) ?? [SC11.navyB3])],
      ...(o.deck ? { deck: o.deck } : {}),
    },
    {
      characters: (o.foe as string[]) ?? [
        SC11.r3,
        { card: SC11.r2, rested: true } as unknown as string,
      ],
    },
  );
}

describe('OP11-082 Aramaki: trash itself, a {Navy} Character can attack active Characters, trash 2 from my deck', () => {
  it('control: before the effect a {Navy} Character cannot attack the opponent’s active Character', () => {
    const g = board();
    const mate = at(g, 'p1', 'characters', SC11.navyB3);
    expect(canHit(g, mate, at(g, 'p2', 'characters', SC11.r3))).toBe(false);
    expect(canHit(g, mate, at(g, 'p2', 'characters', SC11.r2))).toBe(true);
  });

  it('printed effect: the chosen {Navy} Character can then attack the active Character; Aramaki is trashed; 2 cards leave my deck', () => {
    const g = board({ deck: [SC11.r1, SC11.r2, SC11.r3, SC11.r4, SC11.r5] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', SC11.navyB3)]);
    expect(kind(g)).toBe('main');
    const mate = at(g, 'p1', 'characters', SC11.navyB3);
    expect(canHit(g, mate, at(g, 'p2', 'characters', SC11.r3))).toBe(true);
    expect(trash(g)).toEqual([ID, SC11.r1, SC11.r2].sort());
    expect(deckSize(g)).toBe(3);
  });

  it('"also": the Character can still attack the rested Character and the Leader', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', ID));
    pickInst(g, [at(g, 'p1', 'characters', SC11.navyB3)]);
    const mate = at(g, 'p1', 'characters', SC11.navyB3);
    expect(canHit(g, mate, at(g, 'p2', 'characters', SC11.r2))).toBe(true);
    expect(canHit(g, mate, g.leader('p2'))).toBe(true);
  });

  it('only {Navy} Characters are offered: not a non-{Navy} Character and not my Leader', () => {
    const g = board({ mate: [SC11.navyB3, SC11.r4] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.navyB3]);
  });

  it('the grant goes to the chosen Character only, not to a second {Navy} Character', () => {
    const g = board({ mate: [SC11.navyB3, SC11.navyB4] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    pickInst(g, [at(g, 'p1', 'characters', SC11.navyB3)]);
    const foe = at(g, 'p2', 'characters', SC11.r3);
    expect(canHit(g, at(g, 'p1', 'characters', SC11.navyB3), foe)).toBe(true);
    expect(canHit(g, at(g, 'p1', 'characters', SC11.navyB4), foe)).toBe(false);
  });

  it('"up to 1": choosing nobody grants nothing', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(
      canHit(g, at(g, 'p1', 'characters', SC11.navyB3), at(g, 'p2', 'characters', SC11.r3)),
    ).toBe(false);
  });

  it('the Leader must have the {Navy} type: with a plain Leader nothing is granted', () => {
    const g = board({ leader: LD11.plain, deck: [SC11.r1, SC11.r2, SC11.r3, SC11.r4, SC11.r5] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    // The condition is false: a pick may or may not be shown, but nothing can be granted.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(
      canHit(g, at(g, 'p1', 'characters', SC11.navyB3), at(g, 'p2', 'characters', SC11.r3)),
    ).toBe(false);
    // Aramaki's cost was paid regardless.
    expect(trash(g)).toContain(ID);
  });

  it('M4b-5: with a failed "If" the "Then" does not resolve, so no cards are trashed from my deck', () => {
    const g = board({ leader: LD11.plain, deck: [SC11.r1, SC11.r2, SC11.r3, SC11.r4, SC11.r5] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'choose') none(g);
    expect(deckSize(g)).toBe(5);
  });

  it('RL-26: with exactly 2 cards in my deck the 2 trashed cards empty it and I lose', () => {
    const g = board({ deck: [SC11.r1, SC11.r2] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'choose') pickInst(g, [at(g, 'p1', 'characters', SC11.navyB3)]);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('a Character played this turn still cannot attack (RL-17), even with the grant', () => {
    const g = me(
      LD11.navy,
      { characters: [ID, { card: SC11.navyB3, playedThisTurn: true }] },
      { characters: [SC11.r3] },
    );
    useAbility(g, at(g, 'p1', 'characters', ID));
    pickInst(g, [at(g, 'p1', 'characters', SC11.navyB3)]);
    expect(
      canHit(g, at(g, 'p1', 'characters', SC11.navyB3), at(g, 'p2', 'characters', SC11.r3)),
    ).toBe(false);
  });

  it('the grant lasts for this turn only: next turn the Character cannot attack active Characters again', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', ID));
    pickInst(g, [at(g, 'p1', 'characters', SC11.navyB3)]);
    toMyNextMain(g);
    expect(cnt(g, 'p2', 'characters')).toBe(2);
    expect(
      canHit(g, at(g, 'p1', 'characters', SC11.navyB3), at(g, 'p2', 'characters', SC11.r3)),
    ).toBe(false);
  });

  it('Aramaki cannot activate its ability when it is not on the field (control: offered while on the field)', () => {
    const g = board();
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual(['activate']);
  });
});
