/**
 * OP12-021 Ipponmatsu (Character, Green, cost 3, 0 power, Counter +1000, Wisdom, {East Blue}).
 *
 * Card text: "If your Leader has the <Slash> attribute and you have 6 or more rested DON!! cards, this
 * Character cannot be rested by your opponent's effects. [Blocker]"
 *
 * Rules: a permanent effect valid while both conditions hold (CR 8-2-1-2); a rested DON!! is a DON!!
 * in the cost area that is rested: DON!! given to a card have no active/rested state (CR 4-4-2) and
 * the opponent's DON!! are not mine; "cannot be rested by effects" stops an effect, not the rest
 * paid by blocking (a rule) and not a K.O.
 * Scenery: OP01-031 Oden ({Slash} Leader), ST05-001 Shanks (Slash), ST01-001 Luffy (Strike);
 * OP17-038 (rest 4 of your cards: rest up to 1 opposing Character) and EB01-059 Kingdom Come.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  chars,
  EV_LF,
  isRested,
  KINGDOM_COME,
  kind,
  LD_LF,
  noDefence,
  opponentKingdomCome,
  opponentRests,
  theirs,
  trash,
  VAN_LF,
} from './kit-lfa.ts';

const IPPON = 'OP12-021';
const { thatch, mohji } = VAN_LF;

/** p2's turn; p1 has Ipponmatsu, `rested` rested DON!! (the rest of the 10 active) and `leader`. */
function board(
  o: { leader?: string; rested?: number; leaderDon?: number; p2Rested?: number } = {},
) {
  const rested = o.rested ?? 6;
  const given = o.leaderDon ?? 0;
  const p2Rested = o.p2Rested ?? 0;
  return theirs(
    o.leader ?? LD_LF.oden,
    {
      leader: given ? { card: o.leader ?? LD_LF.oden, don: given } : (o.leader ?? LD_LF.oden),
      characters: [IPPON],
      costArea: { active: 10 - rested - given, rested },
    },
    {
      characters: [thatch],
      hand: [EV_LF.restEvent, KINGDOM_COME],
      life: [mohji, mohji, mohji, mohji],
      costArea: { active: 10 - p2Rested, rested: p2Rested },
    },
  );
}

function tryRest(g: ReturnType<typeof board>): boolean {
  const i = at(g, 'p1', 'characters', IPPON);
  opponentRests(g, i);
  return isRested(g, i);
}

describe('OP12-021 Ipponmatsu', () => {
  it('printed values: cost 3, 0 power, Counter +1000, [Blocker]', () => {
    const g = board();
    const i = at(g, 'p1', 'characters', IPPON);
    expect(g.card(i).cost).toBe(3);
    expect(g.power(i)).toBe(0);
    expect(g.card(i).counter).toBe(1000);
    expect(g.card(i).keywords).toContain('Blocker');
  });

  it("{Slash} Leader and 6 rested DON!!: the opponent's rest effect does not rest her", () => {
    expect(tryRest(board({ rested: 6 }))).toBe(false);
  });

  it('boundary: 7 rested DON!! protect too; 5 rested DON!! do not', () => {
    expect(tryRest(board({ rested: 7 }))).toBe(false);
    expect(tryRest(board({ rested: 5 }))).toBe(true);
  });

  it('another {Slash} Leader works the same', () => {
    expect(tryRest(board({ leader: LD_LF.shanks, rested: 6 }))).toBe(false);
  });

  it('a Leader without the <Slash> attribute (Strike): she is rested', () => {
    expect(tryRest(board({ leader: LD_LF.luffy, rested: 6 }))).toBe(true);
  });

  it('DON!! given to my Leader are not rested DON!!: 5 rested + 1 given is not enough', () => {
    expect(tryRest(board({ rested: 5, leaderDon: 1 }))).toBe(true);
  });

  it("the opponent's rested DON!! do not count: 5 of mine and 6 of theirs is not enough", () => {
    expect(tryRest(board({ rested: 5, p2Rested: 6 }))).toBe(true);
  });

  it('only rest effects are stopped: with both conditions a K.O. effect still K.O.s her', () => {
    const g = board();
    opponentKingdomCome(g, at(g, 'p1', 'characters', IPPON));
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([IPPON]);
  });

  it('[Blocker] works with the protection on: she blocks (the rest of blocking is a rule) and is rested', () => {
    const g = board();
    const i = at(g, 'p1', 'characters', IPPON);
    attack(g, at(g, 'p2', 'characters', thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([i]);
    act(g, { type: 'block', blocker: i });
    expect(isRested(g, i)).toBe(true);
    noDefence(g);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([IPPON]); // 0 power: she loses the battle (the protection is for effects only)
  });

  it('with the conditions failing she is a normal [Blocker] that can be rested and then cannot block', () => {
    const g = board({ rested: 5 });
    const i = at(g, 'p1', 'characters', IPPON);
    expect(opponentRests(g, i)).toBe(true);
    expect(isRested(g, i)).toBe(true);
    attack(g, at(g, 'p2', 'characters', thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });
});
