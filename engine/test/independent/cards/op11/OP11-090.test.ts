/**
 * OP11-090 Briscola (Character, Black, cost 2, 2000, Counter +1000, {Animal Kingdom Pirates}/{SMILE},
 * [Blocker]). Its only text is [Blocker].
 *
 * Rules: CR 10-1-4 ([Blocker]: after an attack is declared the defender may rest this Character to
 * make it the new target; a rested Character cannot block), CR 7-1-3 (Block Step), CR 3-7 (no text
 * fires when it is played).
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
  playRaw,
  SC11,
  them,
  trash,
  cnt,
} from './kit-op11c.ts';

const ID = 'OP11-090';

function attacked(o: { rested?: boolean; atk?: string; target?: 'leader' | 'self' } = {}) {
  const g = them(
    LD11.plain,
    { characters: [{ card: ID, rested: o.rested ?? false }] },
    { characters: [o.atk ?? SC11.r5] },
  );
  attack(
    g,
    at(g, 'p2', 'characters', o.atk ?? SC11.r5),
    o.target === 'self' ? at(g, 'p1', 'characters', ID) : g.leader('p1'),
  );
  return g;
}

describe('OP11-090 Briscola: [Blocker]', () => {
  it('has the [Blocker] keyword', () => {
    const g = me(LD11.plain, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('is offered as a Blocker when my Leader is attacked', () => {
    const g = attacked();
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('blocking rests it and makes it the new target: the 7000 attacker K.O.s the 2000 Briscola', () => {
    const g = attacked();
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(trash(g)).toEqual([ID]);
    expect(cnt(g, 'p1', 'life')).toBe(4);
  });

  it('a rested Briscola cannot block', () => {
    const g = attacked({ rested: true });
    expect(blockers(g)).toEqual([]);
  });

  it('declining to block leaves it untouched and the Leader takes the hit', () => {
    const g = attacked();
    act(g, { type: 'block', blocker: null });
    passCounter(g);
    expect(cnt(g, 'p1', 'life')).toBe(3);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(false);
  });

  it('it is not offered as a Blocker for an attack that already targets itself (it is a rested-only target)', () => {
    const g = them(
      LD11.plain,
      { characters: [{ card: ID, rested: true }] },
      { characters: [SC11.r5] },
    );
    attack(g, at(g, 'p2', 'characters', SC11.r5), at(g, 'p1', 'characters', ID));
    expect(blockers(g)).toEqual([]);
  });

  it('playing it asks nothing (no [On Play] text)', () => {
    const g = me(LD11.plain, { hand: [ID] });
    playRaw(g, ID);
    expect(kind(g)).toBe('main');
  });

  it('a Character played this turn can block on the next opposing turn without any restriction', () => {
    const g = me(LD11.plain, { hand: [ID] }, { characters: [SC11.r5] });
    playRaw(g, ID);
    act(g, { type: 'endTurn' });
    attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });
});
