/**
 * OP12-033 Helmeppo (Character, Green, cost 4, 5000, no Counter, {Navy} {East Blue}).
 *
 * Card text: "[Blocker] [On Block] Rest up to 1 of your opponent's Characters with a cost of 5 or
 * less."
 *
 * Rules: [On Block] fires when this Character is chosen to block, before the battle is resolved
 * (CR 10-2-15, 7-1-2); [Blocker] lets an active Character rest to become the new target (CR
 * 10-1-4); the cost limit is on the current cost; "up to 1" may be 0; nothing fires when it is
 * merely played or when another Character blocks.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  blockers,
  chr,
  kind,
  kw,
  LD12,
  need,
  none,
  noDefence,
  offeredCardIds,
  pickInst,
  playRaw,
  S12,
  side,
  sorted,
  theirTurn,
} from './kit-op12a.ts';

const HEL = 'OP12-033';

type P = string | { card: string; rested?: boolean };

/** p2's Main Phase: p1 has an active Helmeppo and `p1Chars`; p2 has `p2Chars` and attacks with its Leader. */
function theirs12(p2Chars: P[], p1Chars: P[] = []) {
  return theirTurn(
    side(LD12.luffy, S12.mohji, {
      characters: [HEL, ...p1Chars],
      costArea: { active: 0, rested: 0 },
    }),
    side(LD12.luffy, S12.sunny, { characters: p2Chars, costArea: { active: 10, rested: 0 } }),
  );
}

function leaderAttack(g: ReturnType<typeof theirs12>) {
  act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
  need(g, 'block', 'p1');
}

function blockWithHelmeppo(g: ReturnType<typeof theirs12>) {
  act(g, { type: 'block', blocker: chr(g, 'p1', HEL) });
}

describe('OP12-033 Helmeppo: [Blocker]; [On Block] rest an opponent Character with a cost of 5 or less', () => {
  it('printed values: cost 4, 5000, no Counter, [Blocker]', () => {
    const g = theirs12([]);
    const c = g.card(chr(g, 'p1', HEL));
    expect([c.cost, c.power, c.counter]).toEqual([4, 5000, null]);
    expect(kw(g, chr(g, 'p1', HEL))).toContain('Blocker');
  });

  it('can be chosen as the blocker', () => {
    const g = theirs12([]);
    leaderAttack(g);
    expect(blockers(g)).toEqual([chr(g, 'p1', HEL)]);
  });

  it('blocking offers exactly the opponent Characters with a cost of 5 or less (5 yes, 6 no)', () => {
    const g = theirs12([S12.marco, S12.kingdew, S12.thatch, S12.oars]);
    leaderAttack(g);
    blockWithHelmeppo(g);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.kingdew, S12.marco].sort());
  });

  it('rests the chosen Character', () => {
    const g = theirs12([S12.marco, S12.kingdew]);
    leaderAttack(g);
    blockWithHelmeppo(g);
    pickInst(g, [chr(g, 'p2', S12.marco)]);
    expect(g.card(chr(g, 'p2', S12.marco)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S12.kingdew)).rested).toBe(false);
  });

  it('"up to 1": choosing nothing rests nothing and the battle goes on', () => {
    const g = theirs12([S12.marco]);
    leaderAttack(g);
    blockWithHelmeppo(g);
    none(g);
    expect(g.card(chr(g, 'p2', S12.marco)).rested).toBe(false);
    expect(kind(g)).toBe('counter');
  });

  it('resolves before the battle: the effect is done when the Counter Step starts and Helmeppo (5000 vs 5000) is K.O.d afterwards', () => {
    const g = theirs12([S12.marco]);
    leaderAttack(g);
    blockWithHelmeppo(g);
    pickInst(g, [chr(g, 'p2', S12.marco)]);
    expect(kind(g)).toBe('counter');
    expect(g.card(chr(g, 'p2', S12.marco)).rested).toBe(true);
    noDefence(g);
    expect(sorted(g, 'p1', 'trash')).toEqual([HEL]);
    expect(g.life('p1')).toBe(4);
  });

  it('with no Character of cost 5 or less nothing is asked', () => {
    const g = theirs12([S12.thatch]);
    leaderAttack(g);
    blockWithHelmeppo(g);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('counter');
    expect(g.card(chr(g, 'p2', S12.thatch)).rested).toBe(false);
  });

  it('must not: not blocking does not fire it', () => {
    const g = theirs12([S12.marco]);
    leaderAttack(g);
    act(g, { type: 'block', blocker: null });
    expect(kind(g)).toBe('counter');
    expect(g.card(chr(g, 'p2', S12.marco)).rested).toBe(false);
  });

  it('must not: another Character blocking does not fire it', () => {
    const g = theirs12([S12.marco], [S12.killer]);
    leaderAttack(g);
    act(g, { type: 'block', blocker: chr(g, 'p1', S12.killer) });
    expect(kind(g)).toBe('counter');
    expect(g.card(chr(g, 'p2', S12.marco)).rested).toBe(false);
  });

  it('must not: playing it fires nothing', () => {
    const g = theirTurn(
      side(LD12.luffy, S12.mohji, { hand: [HEL], costArea: { active: 4, rested: 0 } }),
      side(LD12.luffy, S12.sunny, { characters: [S12.marco], costArea: { active: 10, rested: 0 } }),
    );
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    playRaw(g, HEL);
    expect(kind(g)).toBe('main');
    expect(g.card(chr(g, 'p2', S12.marco)).rested).toBe(false);
  });
});
