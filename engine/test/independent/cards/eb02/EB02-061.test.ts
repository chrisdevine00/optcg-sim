/**
 * EB02-061 Monkey.D.Luffy (Purple Character, cost 6, 7000, no Counter, {Straw Hat Crew}/{Water Seven}).
 *
 * Card text: "If your Leader is multicolored and your opponent has 5 or more DON!! cards on their field,
 * this Character gains [Rush]. [When Attacking] [Once Per Turn] You may return 2 of your active DON!!
 * cards to your DON!! deck: Set this Character as active. Then, add 1 card from the top of your Life
 * cards to your hand."
 *
 * Rules: "DON!! cards on their field" counts the cost area (active and rested) plus DON!! given to
 * cards (CR 3-1-2); [Rush] lets a Character attack the turn it is played (CR 10-1-1); the cost returns
 * exactly 2 ACTIVE cost-area DON!!; a Life card added to the hand is not damage (no [Trigger]);
 * [Once Per Turn] allows one use per turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  canAttackAnything,
  canHit,
  chars,
  decision,
  donOf,
  hand,
  kind,
  LE,
  mine,
  need,
  no,
  noDefence,
  SE,
  yes,
  kw,
  lifeCards,
  passBlock,
  unusable,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const LUFFY = 'EB02-061';
const JINBE = 'EB02-055';

/** Luffy placed (not played this turn) for the [When Attacking] tests; p1 has `life` Life cards. */
function attacker(o: { active?: number; rested?: number; life?: string[]; leader?: string } = {}) {
  return mine(
    o.leader ?? LE.lim,
    {
      characters: [LUFFY],
      costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
      life: o.life ?? [SE.marco, SE.sai, SE.mohji, SE.komachiyo],
    },
    {},
  );
}

function swing(g: ReturnType<typeof attacker>) {
  attack(g, ch(g, 'p1', LUFFY), g.leader('p2'));
}

describe('EB02-061 Monkey.D.Luffy: printed values', () => {
  it('cost 6, 7000 power, no Counter, no printed keyword', () => {
    const g = attacker();
    const l = ch(g, 'p1', LUFFY);
    expect(g.card(l).cost).toBe(6);
    expect(g.power(l)).toBe(7000);
    expect(g.card(l).counter).toBeNull();
    expect(kw(g, l)).toEqual([]);
  });
});

describe('EB02-061 Monkey.D.Luffy: conditional [Rush]', () => {
  const justPlayed = (
    leader: string,
    opp: { active: number; rested: number },
    oppLeader?: unknown,
  ) =>
    mine(
      leader,
      { characters: [{ card: LUFFY, playedThisTurn: true }] },
      { costArea: opp, ...(oppLeader ? { leader: oppLeader as never } : {}) },
    );

  it('multicolored Leader and the opponent has 5 DON!!: gains [Rush] and may attack the turn it was played', () => {
    const g = justPlayed(LE.lim, { active: 5, rested: 0 });
    const l = ch(g, 'p1', LUFFY);
    expect(kw(g, l)).toContain('Rush');
    expect(canHit(g, l, g.leader('p2'))).toBe(true);
  });

  it('boundary: the opponent has 4 DON!!: no [Rush], cannot attack the turn it was played', () => {
    const g = justPlayed(LE.lim, { active: 4, rested: 0 });
    const l = ch(g, 'p1', LUFFY);
    expect(kw(g, l)).not.toContain('Rush');
    expect(canAttackAnything(g, l)).toBe(false);
  });

  it("rested DON!! count towards the opponent's 5", () => {
    const g = justPlayed(LE.lim, { active: 3, rested: 2 });
    expect(kw(g, ch(g, 'p1', LUFFY))).toContain('Rush');
  });

  it("DON!! given to the opponent's cards count towards the 5", () => {
    const g = mine(
      LE.lim,
      { characters: [{ card: LUFFY, playedThisTurn: true }] },
      { costArea: { active: 3, rested: 0 }, leader: { card: LE.luffy, don: 2 } as never },
    );
    expect(kw(g, ch(g, 'p1', LUFFY))).toContain('Rush');
  });

  it('a Leader that is not multicolored: no [Rush] even when the opponent has 10 DON!!', () => {
    const g = justPlayed(LE.luffy, { active: 10, rested: 0 });
    const l = ch(g, 'p1', LUFFY);
    expect(kw(g, l)).not.toContain('Rush');
    expect(canAttackAnything(g, l)).toBe(false);
  });

  it('a Character that was not played this turn may attack whatever the condition says', () => {
    const g = mine(LE.luffy, { characters: [LUFFY] }, { costArea: { active: 0, rested: 0 } });
    expect(canHit(g, ch(g, 'p1', LUFFY), g.leader('p2'))).toBe(true);
  });
});

describe('EB02-061 Monkey.D.Luffy: [When Attacking] [Once Per Turn] return 2 active DON!!: set this active, add 1 Life card to the hand', () => {
  it('paying: 2 active DON!! go back to the DON!! deck, Luffy is active again, the top Life card goes to the hand', () => {
    const g = attacker();
    swing(g);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(donOf(g, 'p1').active).toBe(8);
    expect(g.card(ch(g, 'p1', LUFFY)).rested).toBe(false);
    expect(hand(g)).toEqual([SE.marco]);
    expect(lifeCards(g)).toEqual([SE.sai, SE.mohji, SE.komachiyo]);
    expect(g.life('p1')).toBe(3);
  });

  it('the 2 DON!! return to the DON!! deck (the field loses 2 DON!!)', () => {
    const g = attacker();
    const before = donOf(g, 'p1');
    swing(g);
    yes(g, 'p1');
    const after = donOf(g, 'p1');
    expect(
      before.active + before.rested + before.given - (after.active + after.rested + after.given),
    ).toBe(2);
  });

  it('declining ("You may") leaves Luffy rested, Life and DON!! untouched', () => {
    const g = attacker();
    swing(g);
    no(g, 'p1');
    expect(g.card(ch(g, 'p1', LUFFY)).rested).toBe(true);
    expect(donOf(g, 'p1').active).toBe(10);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });

  it('unpayable: with 1 active DON!! the cost cannot be paid', () => {
    const g = attacker({ active: 1, rested: 0 });
    swing(g);
    unusable(g, 'p1');
    expect(g.card(ch(g, 'p1', LUFFY)).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });

  it('unpayable: rested DON!! cannot pay (1 active + 6 rested)', () => {
    const g = attacker({ active: 1, rested: 6 });
    swing(g);
    unusable(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 6 });
  });

  it('exactly 2 active DON!! is enough', () => {
    const g = attacker({ active: 2, rested: 0 });
    swing(g);
    yes(g, 'p1');
    expect(donOf(g, 'p1').active).toBe(0);
    expect(g.card(ch(g, 'p1', LUFFY)).rested).toBe(false);
    expect(hand(g)).toEqual([SE.marco]);
  });

  it('a Life card added to the hand is not damage: its [Trigger] is not offered', () => {
    const g = attacker({ life: [JINBE, SE.sai, SE.mohji, SE.komachiyo], leader: LE.fishMan });
    swing(g);
    yes(g, 'p1');
    expect(hand(g)).toEqual([JINBE]);
    expect(chars(g)).toEqual([LUFFY]);
    expect(decision(g)?.kind).not.toBe('trigger');
  });

  it('with no Life cards the DON!! are still returned and Luffy is set active; nothing is added', () => {
    const g = attacker({ life: [] });
    swing(g);
    yes(g, 'p1');
    expect(donOf(g, 'p1').active).toBe(8);
    expect(g.card(ch(g, 'p1', LUFFY)).rested).toBe(false);
    expect(hand(g)).toEqual([]);
  });

  it('[Once Per Turn]: after it was used, a second attack in the same turn offers nothing', () => {
    const g = attacker();
    swing(g);
    yes(g, 'p1');
    noDefence(g);
    // Back at the Main Phase with Luffy active again: attack a second time.
    need(g, 'main', 'p1');
    swing(g);
    const d = decision(g);
    expect(d?.kind === 'optional' && d.player === 'p1').toBe(false);
    passBlock(g);
    expect(kind(g)).not.toBe('optional');
    expect(donOf(g, 'p1').active).toBe(8);
    expect(g.life('p1')).toBe(3);
    void act;
    void SE;
  });
});
