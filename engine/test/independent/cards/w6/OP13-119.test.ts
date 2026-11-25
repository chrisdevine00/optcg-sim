/**
 * OP13-119 Portgas.D.Ace (Character, Blue, cost 6, 7000, no Counter, {Whitebeard Pirates}).
 *
 * Card text: "If you have 3 or less Life cards, this Character gains [Rush]." "[On Play] Give up to 1
 * rested DON!! card to your Leader. Then, you may return up to 1 of your opponent's Characters with a
 * cost of 5 or less to the owner's hand. If you do, your opponent plays up to 1 Character card with a
 * cost of 4 or less from their hand."
 *
 * Rules: a conditional keyword is granted only while the condition holds (CR 10-1-1 [Rush]); "up to
 * 1" lets me choose none; "then" resolves even if the DON!! was not given, but "if you do" needs the
 * return to have happened (CR 4-10-1, 4-10-2); the opponent chooses their own card, plays it for
 * free, active; an "up to" pick over a hidden hand with a filter is asked even when nothing matches;
 * the Character just returned is in their hand and may be the one they play (M6b-Q75).
 */
import { describe, expect, it } from 'vitest';
import { decision } from '../../helpers.ts';
import {
  at,
  atMain,
  canHit,
  chars,
  choices,
  don,
  hand,
  kind,
  kw,
  LW,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  playRaw,
  sorted,
  trash,
  V13,
  W6,
  snap,
} from './kit-w6b.ts';

const ACE = 'OP13-119';
const FILL = 'OP02-060';
const LIFE = (n: number) => Array.from({ length: n }, () => FILL);

/** p1 has 10 DON!! (8 active, 2 rested before the 6 for Ace) and `life` Life cards; p2 as given. */
function play(o: { life?: number; chars?: string[]; hand?: string[] } = {}) {
  const g = mine(
    LW.luffy,
    { hand: [ACE], costArea: { active: 8, rested: 2 }, life: LIFE(o.life ?? 3) },
    { characters: o.chars ?? [], hand: o.hand ?? [] },
  );
  playRaw(g, ACE);
  return g;
}

/** Answer the "give DON!!" pick: give 1 to my Leader (or none). */
function giveDon(g: ReturnType<typeof play>, give = true) {
  need(g, 'choose', 'p1');
  if (give) pickInst(g, [g.leader('p1')]);
  else none(g);
}

describe('OP13-119 Portgas.D.Ace: [Rush] with 3 or less Life; [On Play] give a rested DON!! to my Leader, may return a cost-5 Character, then the opponent plays a cost-4 Character', () => {
  it('printed values: cost 6, 7000 power, no Counter', () => {
    const g = mine(LW.luffy, { characters: [ACE] });
    const c = g.card(at(g, 'p1', 'characters', ACE));
    expect(c.cost).toBe(6);
    expect(g.power(c.instance)).toBe(7000);
    expect(c.counter ?? null).toBeNull();
  });

  it('[Rush] with exactly 3 Life: it can attack the turn it is played; with 4 Life it cannot', () => {
    const three = play({ life: 3 });
    giveDon(three);
    // Nothing to return (no opposing Characters): the remaining prompts are empty or skipped.
    if (kind(three) === 'choose') none(three);
    const a3 = at(three, 'p1', 'characters', ACE);
    expect(kw(three, a3)).toContain('Rush');
    expect(canHit(three, a3, three.leader('p2'))).toBe(true);

    const four = play({ life: 4 });
    giveDon(four);
    if (kind(four) === 'choose') none(four);
    const a4 = at(four, 'p1', 'characters', ACE);
    expect(kw(four, a4)).not.toContain('Rush');
    expect(canHit(four, a4, four.leader('p2'))).toBe(false);
  });

  it('[Rush] with 0 Life as well (3 or less)', () => {
    const g = play({ life: 0 });
    giveDon(g);
    if (kind(g) === 'choose') none(g);
    expect(kw(g, at(g, 'p1', 'characters', ACE))).toContain('Rush');
  });

  it('gives 1 rested DON!! to my Leader: the Leader has it, one fewer DON!! is rested', () => {
    const g = play();
    const before = don(g, 'p1');
    expect(before).toMatchObject({ rested: 8, active: 2, given: 0 });
    giveDon(g);
    if (kind(g) === 'choose') none(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 7, active: 2, given: 1 });
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to 1": I may give no DON!!; the "Then" part still resolves', () => {
    const g = play({ chars: [V13.sai], hand: [] });
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
    // The return pick follows.
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.sai]);
  });

  it("returns up to 1 Character of cost 5 or less to its owner's hand: cost 5 is offered, cost 6 is not", () => {
    const g = play({ chars: [V13.kingdew, V13.thatch, V13.sai] });
    giveDon(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.sai, V13.kingdew].sort());
    pickCards(g, [V13.kingdew]);
    // The opponent is asked to play; they hold only the returned cost-5 Character: nothing qualifies.
    need(g, 'choose', 'p2');
    expect(choices(g)).toEqual([]);
    none(g);
    expect(atMain(g, 'p1'), snap(g)).toBe(true);
    expect(sorted(g, 'p2', 'characters')).toEqual([V13.sai, V13.thatch].sort());
    expect(hand(g, 'p2')).toEqual([V13.kingdew]);
  });

  it('"you may": returning nobody means the opponent does not play anything', () => {
    const g = play({ chars: [V13.sai], hand: [V13.marco] });
    giveDon(g);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(atMain(g, 'p1'), snap(g)).toBe(true);
    expect(hand(g, 'p2')).toEqual([V13.marco]);
    expect(chars(g, 'p2')).toEqual([V13.sai]);
  });

  it('the opponent chooses: Characters of cost 4 or less in their hand are offered (the returned one included); cost 5 and Events are not', () => {
    const g = play({
      chars: [V13.sai, V13.kingdew],
      hand: [V13.marco, V13.hajrudin, V13.kingdew, W6.beamSword],
    });
    giveDon(g);
    pickCards(g, [V13.sai]);
    need(g, 'choose', 'p2');
    expect(offeredIds(g)).toEqual([V13.sai, V13.marco, V13.hajrudin].sort());
    pickCards(g, [V13.hajrudin]);
    expect(atMain(g, 'p1')).toBe(true);
    expect(sorted(g, 'p2', 'characters')).toEqual([V13.kingdew, V13.hajrudin].sort());
    expect(hand(g, 'p2')).toEqual([V13.sai, V13.marco, V13.kingdew, W6.beamSword].sort());
    // Played for free by an effect: they spent no DON!!, and it is not rested.
    expect(g.card(at(g, 'p2', 'characters', V13.hajrudin)).rested).toBe(false);
  });

  it('the opponent may play the Character just returned, and "up to 1" lets them play none', () => {
    const replay = play({ chars: [V13.sai], hand: [] });
    giveDon(replay);
    pickCards(replay, [V13.sai]);
    need(replay, 'choose', 'p2');
    expect(offeredIds(replay)).toEqual([V13.sai]);
    pickCards(replay, [V13.sai]);
    expect(chars(replay, 'p2')).toEqual([V13.sai]);

    const skip = play({ chars: [V13.sai], hand: [V13.marco] });
    giveDon(skip);
    pickCards(skip, [V13.sai]);
    need(skip, 'choose', 'p2');
    expect(mayChooseNone(skip)).toBe(true);
    none(skip);
    expect(chars(skip, 'p2')).toEqual([]);
    expect(hand(skip, 'p2')).toEqual([V13.sai, V13.marco].sort());
  });

  it('the opponent is asked even when nothing in their hand qualifies (the pause tells nothing), and plays nothing', () => {
    const g = play({ chars: [V13.kingdew], hand: [V13.thatch, W6.beamSword] });
    giveDon(g);
    pickCards(g, [V13.kingdew]);
    expect(kind(g)).toBe('choose');
    expect(decision(g)?.player).toBe('p2');
    expect(choices(g)).toEqual([]);
    none(g);
    expect(chars(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('with 5 Characters the opponent has a free place after the return: the played one needs nothing trashed', () => {
    const five = [V13.sai, V13.sai, V13.marco, V13.marco, V13.hajrudin];
    const g = play({ chars: five, hand: [V13.komachiyo] });
    giveDon(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', V13.hajrudin)]);
    need(g, 'choose', 'p2');
    pickCards(g, [V13.komachiyo]);
    expect(atMain(g, 'p1'), snap(g)).toBe(true);
    expect(sorted(g, 'p2', 'characters')).toEqual(
      [V13.sai, V13.sai, V13.marco, V13.marco, V13.komachiyo].sort(),
    );
    expect(trash(g, 'p2')).toEqual([]);
  });
});
