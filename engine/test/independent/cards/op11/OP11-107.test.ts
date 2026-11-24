/**
 * OP11-107 Topknot Neptunian (Character, Yellow, cost 5, 6000, Counter +1000, {Neptunian}, [Blocker]).
 *
 * Card text: "[Blocker] [Activate: Main] [Once Per Turn] If your Leader is [Shirahoshi], you may turn 1
 * card from the top of your Life cards face-down: Set this Character as active at the end of this
 * turn."
 *
 * Rules: CR 8-3-2 (If), CR 8-3-1-4 (cost), CR 1-3-2-1 (needs a face-up top Life card), CR 10-2
 * ([Once Per Turn]), the Character stays rested until the end of my turn, then it is set active, so
 * it can [Blocker] during my opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  kind,
  LD11,
  lifeFaces,
  lifeUp,
  me,
  need,
  offeredAbilities,
  SC11,
  unusable,
  up,
  useAbility,
  yes,
  type LifeRow,
} from './kit-op11c.ts';

const ID = 'OP11-107';

function board(o: { leader?: string; rested?: boolean; life?: LifeRow } = {}) {
  return me(
    o.leader ?? LD11.shirahoshi,
    { characters: [{ card: ID, rested: o.rested ?? true }], life: o.life ?? lifeUp(4) },
    { characters: [SC11.r5] },
  );
}

const rested = (g: ReturnType<typeof board>) => g.card(at(g, 'p1', 'characters', ID)).rested;

function activate(g: ReturnType<typeof board>) {
  useAbility(g, at(g, 'p1', 'characters', ID));
  if (kind(g) === 'optional') yes(g, 'p1');
}

describe('OP11-107 Topknot Neptunian: turn a Life card face-down to set itself active at the end of the turn', () => {
  it('has [Blocker]', () => {
    const g = board();
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('printed effect: it stays rested for the rest of my turn and is active when my opponent’s turn begins', () => {
    const g = board();
    activate(g);
    expect(rested(g)).toBe(true);
    expect(lifeFaces(g)).toEqual([false, true, true, true]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(rested(g)).toBe(false);
  });

  it('control: without using it a rested Topknot is still rested on my opponent’s turn', () => {
    const g = board();
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(rested(g)).toBe(true);
  });

  it('once it is active again it can block an attack on my Leader', () => {
    const g = board();
    activate(g);
    act(g, { type: 'endTurn' });
    attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('[Once Per Turn]: after using it, it is not offered again this turn', () => {
    const g = board();
    activate(g);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('control: if I never activate it my Life stays face-up and it stays rested', () => {
    const g = board();
    expect(lifeFaces(g)).toEqual([true, true, true, true]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(rested(g)).toBe(true);
    expect(lifeFaces(g)).toEqual([true, true, true, true]);
  });

  it('a Leader that is not [Shirahoshi]: it does not become active', () => {
    const g = board({ leader: LD11.plain });
    if (offeredAbilities(g, at(g, 'p1', 'characters', ID)).length) {
      useAbility(g, at(g, 'p1', 'characters', ID));
      if (kind(g) === 'optional') unusable(g, 'p1');
    }
    expect(lifeFaces(g)).toEqual([true, true, true, true]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(rested(g)).toBe(true);
  });

  it('unpayable: the top Life card is already face-down', () => {
    const g = board({ life: [SC11.r1, up(SC11.r2), up(SC11.r3)] });
    if (offeredAbilities(g, at(g, 'p1', 'characters', ID)).length) {
      useAbility(g, at(g, 'p1', 'characters', ID));
      unusable(g, 'p1');
    }
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(rested(g)).toBe(true);
  });

  it('unpayable: no Life cards', () => {
    const g = board({ life: [] });
    if (offeredAbilities(g, at(g, 'p1', 'characters', ID)).length) {
      useAbility(g, at(g, 'p1', 'characters', ID));
      unusable(g, 'p1');
    }
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(rested(g)).toBe(true);
  });
});
