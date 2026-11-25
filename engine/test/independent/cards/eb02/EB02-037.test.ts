/**
 * EB02-037 Franky (Character, Purple, cost 3, 4000, Counter +1000, {Straw Hat Crew}/{Water Seven}).
 *
 * Card text: "[On Play]/[When Attacking] If your Leader has the "Straw Hat Crew" type and the number of
 * DON!! cards on your field is equal to or less than the number on your opponent's field, add up to
 * 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: "DON!! cards on your field" counts the cost area (active and rested) and DON!! given to
 * cards; "add up to N DON!!" asks a count (most first); an added DON!! is rested (CR 6-5-5-?).
 * The "If" has no colon: an effect condition.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  answerCount,
  attack,
  countOptions,
  decision,
  donOf,
  E2C,
  E2L,
  kind,
  mine,
  need,
  playRaw,
} from './kit-eb02a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const FRANKY = 'EB02-037';

/** DON!! on the field of a player: cost area plus given. */
const onField = (g: TestGame, who: 'p1' | 'p2') => {
  const d = donOf(g, who);
  return d.active + d.rested + d.given;
};

/** Play Franky from hand; p1 has `mineDon` active DON!! in the cost area, p2 has `oppDon`. */
function played(leader: string, mineDon: number, oppDon: number, ask = 1) {
  const g = mine(
    leader,
    { hand: [FRANKY], costArea: { active: mineDon, rested: 0 } },
    { costArea: { active: oppDon, rested: 0 } },
  );
  playRaw(g, FRANKY);
  answerIfAsked(g, ask);
  return g;
}

function answerIfAsked(g: TestGame, n: number) {
  if (kind(g) === 'choose' && countOptions(g).length > 0) answerCount(g, n);
}

describe('EB02-037 Franky: [On Play] add 1 rested DON!! if my DON!! is equal to or less than the opponent’s', () => {
  it('equal counts (5 and 5 after paying the cost): adds 1 rested DON!! from the DON!! deck', () => {
    const g = played(E2L.shc, 5, 5);
    expect(onField(g, 'p1')).toBe(6);
    const d = donOf(g, 'p1');
    // 3 rested by the cost, 1 rested by the effect, 2 active.
    expect([d.active, d.rested]).toEqual([2, 4]);
    expect(d.deck).toBe(4);
  });

  it('boundary: one more DON!! than the opponent has (6 against 5) adds nothing', () => {
    const g = played(E2L.shc, 6, 5);
    expect(onField(g, 'p1')).toBe(6);
    expect(decision(g)?.kind).toBe('main');
  });

  it('boundary: one fewer than the opponent (4 against 5) adds 1', () => {
    const g = played(E2L.shc, 4, 5);
    expect(onField(g, 'p1')).toBe(5);
  });

  it('with a Leader that is not {Straw Hat Crew} nothing is added', () => {
    const g = played(E2L.croc, 5, 5);
    expect(onField(g, 'p1')).toBe(5);
    expect(decision(g)?.kind).toBe('main');
  });

  it('the DON!! count is a "up to": the count question allows 0 and 1, and 0 adds nothing', () => {
    const g = mine(
      E2L.shc,
      { hand: [FRANKY], costArea: { active: 5, rested: 0 } },
      { costArea: { active: 5, rested: 0 } },
    );
    playRaw(g, FRANKY);
    if (kind(g) === 'choose' && countOptions(g).length > 0) {
      expect(countOptions(g)).toEqual(expect.arrayContaining(['0', '1']));
      expect(countOptions(g)).not.toContain('2');
      answerCount(g, 0);
    }
    expect(onField(g, 'p1')).toBe(5);
  });

  it('the added DON!! is rested, not active', () => {
    const g = played(E2L.shc, 5, 5);
    // 5 active - 3 (cost) = 2 active; the new DON!! did not become active.
    expect(donOf(g, 'p1').active).toBe(2);
  });

  it('DON!! given to my cards count as on my field (4 in the cost area + 1 given = 5 against 5)', () => {
    const g = mine(
      { card: E2L.shc, don: 1 },
      { hand: [FRANKY], costArea: { active: 4, rested: 0 } },
      { costArea: { active: 5, rested: 0 } },
    );
    playRaw(g, FRANKY);
    answerIfAsked(g, 1);
    expect(onField(g, 'p1')).toBe(6);
  });

  it('given DON!! count against me too: 5 in the cost area + 1 given (6) against 5 adds nothing', () => {
    const g = mine(
      { card: E2L.shc, don: 1 },
      { hand: [FRANKY], costArea: { active: 5, rested: 0 } },
      { costArea: { active: 5, rested: 0 } },
    );
    playRaw(g, FRANKY);
    expect(onField(g, 'p1')).toBe(6);
    expect(decision(g)?.kind).toBe('main');
  });

  it('the opponent’s DON!! given to their Leader count in their total (4 in the cost area + 1 given = 5)', () => {
    const g = mine(
      E2L.shc,
      { hand: [FRANKY], costArea: { active: 5, rested: 0 } },
      { leader: { card: E2L.croc, don: 1 }, costArea: { active: 4, rested: 0 } },
    );
    playRaw(g, FRANKY);
    answerIfAsked(g, 1);
    expect(onField(g, 'p1')).toBe(6);
  });
});

describe('EB02-037 Franky: [When Attacking] the same effect', () => {
  function attacking(leader: string, mineDon: number, oppDon: number) {
    const g = mine(
      leader,
      { characters: [FRANKY], costArea: { active: mineDon, rested: 0 } },
      { costArea: { active: oppDon, rested: 0 } },
    );
    attack(g, g.find('p1', 'characters', FRANKY), g.leader('p2'));
    answerIfAsked(g, 1);
    return g;
  }

  it('attacking with equal DON!! adds 1 rested DON!!', () => {
    const g = attacking(E2L.shc, 5, 5);
    expect(onField(g, 'p1')).toBe(6);
    expect(donOf(g, 'p1').rested).toBe(1);
  });

  it('attacking with more DON!! than the opponent adds nothing', () => {
    const g = attacking(E2L.shc, 6, 5);
    expect(onField(g, 'p1')).toBe(6);
  });

  it('attacking with fewer DON!! adds 1', () => {
    const g = attacking(E2L.shc, 3, 5);
    expect(onField(g, 'p1')).toBe(4);
  });

  it('attacking with a non-{Straw Hat Crew} Leader adds nothing', () => {
    const g = attacking(E2L.croc, 5, 5);
    expect(onField(g, 'p1')).toBe(5);
  });

  it('is not an [Activate: Main]: nothing is added before the attack', () => {
    const g = mine(
      E2L.shc,
      { characters: [FRANKY], costArea: { active: 5, rested: 0 } },
      { costArea: { active: 5, rested: 0 } },
    );
    need(g, 'main', 'p1');
    expect(onField(g, 'p1')).toBe(5);
    act(g, { type: 'endTurn' });
    expect(E2C.mohji).toBeDefined();
  });
});
