/**
 * OP09-083 Van Augur (Character, Black, cost 5, 6000, Counter +1000, {Blackbeard Pirates}, Ranged).
 *
 * Card text: "[Activate: Main] You may rest this Character: If your Leader has the "Blackbeard
 * Pirates" type, give up to 1 of your opponent's Characters −3 cost during this turn.
 * [On K.O.] Draw 1 card."
 *
 * Rules: the "If" is after the cost colon, so it is an effect condition (the cost is paid, then the
 * check). "Up to 1" may be 0. A cost is floored at 0 outside a calculation (CR 1-3-6-2). "During
 * this turn" ends in the End Phase (CR 6-6-1-3). [On K.O.] fires on a battle K.O. (CR 10-2-1).
 * Activating an [Activate: Main] whose only cost is "you may rest this" is itself the choice to pay.
 */
import { describe, expect, it } from 'vitest';
import {
  abil,
  actRaw,
  at,
  atMain,
  attack,
  canAct,
  chr,
  deck,
  endTurn,
  hand,
  LD9,
  mayEnd,
  mine,
  need,
  noDefenceAtAll,
  none,
  offeredIds,
  offeredInsts,
  pickInst,
  SC9,
  theirs,
} from './kit-op09c.ts';

const VAN = 'OP09-083';

function board(leader: string = LD9.bbp, p2chars: string[] = [SC9.c5], own: string[] = []) {
  return mine(leader, { characters: [VAN, ...own] }, { characters: p2chars });
}

/** Activate Van Augur and leave the target pick pending. */
function start(g: ReturnType<typeof board>) {
  actRaw(g, chr(g, 'p1', VAN));
  need(g, 'choose', 'p1');
}

describe('OP09-083 Van Augur: [Activate: Main] rest this: -3 cost; [On K.O.] draw 1', () => {
  it('printed values: Black Character, cost 5, 6000, Counter +1000', () => {
    const g = board();
    const c = g.card(chr(g, 'p1', VAN));
    expect(c.cost).toBe(5);
    expect(c.power).toBe(6000);
    expect(c.counter).toBe(1000);
  });

  it('is offered in my Main Phase; using it rests Van Augur and gives the chosen opponent Character -3 cost', () => {
    const g = board();
    const van = chr(g, 'p1', VAN);
    expect(canAct(g, van)).toBe(true);
    start(g);
    pickInst(g, [chr(g, 'p2', SC9.c5)]);
    expect(atMain(g)).toBe(true);
    expect(g.card(van).rested).toBe(true);
    expect(g.card(chr(g, 'p2', SC9.c5)).cost).toBe(2);
  });

  it("offers only the opponent's Characters, never my own", () => {
    const g = board(LD9.bbp, [SC9.c5, SC9.c3], [SC9.c4]);
    start(g);
    expect(offeredIds(g)).toEqual([SC9.c3, SC9.c5].sort());
    expect(offeredInsts(g)).not.toContain(chr(g, 'p1', SC9.c4));
    expect(offeredInsts(g)).not.toContain(chr(g, 'p1', VAN));
  });

  it('the reduction is exactly 3: a cost-4 Character becomes cost 1', () => {
    const g = board(LD9.bbp, [SC9.c4]);
    start(g);
    pickInst(g, [chr(g, 'p2', SC9.c4)]);
    expect(g.card(chr(g, 'p2', SC9.c4)).cost).toBe(1);
  });

  it('a cost below 0 reads as 0 (CR 1-3-6-2): a cost-2 Character goes to 0', () => {
    const g = board(LD9.bbp, [SC9.c2]);
    start(g);
    pickInst(g, [chr(g, 'p2', SC9.c2)]);
    expect(g.card(chr(g, 'p2', SC9.c2)).cost).toBe(0);
  });

  it("only the chosen Character is reduced; the opponent's other Characters keep their cost", () => {
    const g = board(LD9.bbp, [SC9.c5, SC9.c3]);
    start(g);
    pickInst(g, [chr(g, 'p2', SC9.c5)]);
    expect(g.card(chr(g, 'p2', SC9.c5)).cost).toBe(2);
    expect(g.card(chr(g, 'p2', SC9.c3)).cost).toBe(3);
  });

  it('"up to 1": the target may be skipped, but the rest cost is still paid', () => {
    const g = board();
    start(g);
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(chr(g, 'p2', SC9.c5)).cost).toBe(5);
    expect(g.card(chr(g, 'p1', VAN)).rested).toBe(true);
  });

  it('a Leader without {Blackbeard Pirates}: the cost is paid, the cost reduction does nothing', () => {
    const g = board(LD9.luffy);
    const van = chr(g, 'p1', VAN);
    actRaw(g, van);
    // Either nothing is asked, or an empty pick: the effect has no candidate.
    if (g.decider === 'p1' && mayEnd(g)) {
      expect(offeredInsts(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.card(chr(g, 'p2', SC9.c5)).cost).toBe(5);
    expect(g.card(van).rested).toBe(true);
  });

  it('an already rested Van Augur cannot pay the rest cost: the ability is not offered', () => {
    const g = mine(
      LD9.bbp,
      { characters: [{ card: VAN, rested: true }] },
      { characters: [SC9.c5] },
    );
    expect(abil(g, chr(g, 'p1', VAN))).toEqual([]);
  });

  it("the reduction lasts for this turn only: the opponent's Character has its printed cost on their turn", () => {
    const g = board();
    start(g);
    pickInst(g, [chr(g, 'p2', SC9.c5)]);
    expect(g.card(chr(g, 'p2', SC9.c5)).cost).toBe(2);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', SC9.c5)).cost).toBe(5);
  });

  it('once rested it cannot be used again in the same turn', () => {
    const g = board();
    start(g);
    pickInst(g, [chr(g, 'p2', SC9.c5)]);
    expect(abil(g, chr(g, 'p1', VAN))).toEqual([]);
  });

  it("[On K.O.]: when K.O.'d in battle it draws 1 card", () => {
    const g = theirs(
      LD9.bbp,
      { characters: [{ card: VAN, rested: true }], deck: [SC9.c2, SC9.c3, SC9.c4, SC9.c5] },
      { characters: [SC9.c7] },
    );
    attack(g, chr(g, 'p2', SC9.c7), chr(g, 'p1', VAN));
    noDefenceAtAll(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([SC9.c2]);
    expect(deck(g)).toHaveLength(3);
  });

  it('[On K.O.] draws even when my Leader is not {Blackbeard Pirates} (it has no condition)', () => {
    const g = theirs(
      LD9.luffy,
      { characters: [{ card: VAN, rested: true }], deck: [SC9.c2, SC9.c3, SC9.c4, SC9.c5] },
      { characters: [SC9.c7] },
    );
    attack(g, chr(g, 'p2', SC9.c7), chr(g, 'p1', VAN));
    noDefenceAtAll(g);
    expect(hand(g)).toEqual([SC9.c2]);
  });

  it('must not draw when it survives the battle (an attacker with less power loses)', () => {
    const g = theirs(
      LD9.bbp,
      { characters: [{ card: VAN, rested: true }], deck: [SC9.c2, SC9.c3, SC9.c4, SC9.c5] },
      { characters: [SC9.c3] },
    );
    attack(g, chr(g, 'p2', SC9.c3), chr(g, 'p1', VAN));
    noDefenceAtAll(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(hand(g)).toEqual([]);
  });

  it("is not offered during the opponent's turn", () => {
    const g = theirs(LD9.bbp, { characters: [VAN] }, { characters: [SC9.c5] });
    expect(abil(g, at(g, 'p1', 'characters', VAN))).toEqual([]);
  });
});
