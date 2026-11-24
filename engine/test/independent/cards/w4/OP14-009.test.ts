/**
 * OP14-009 Trafalgar Law (Character, red, cost 9, 10000, {Heart Pirates}/{Supernovas}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[Rush] [On Your Opponent's Attack] [Once Per Turn] You may trash 2 cards from your
 * hand: Select your Leader and 1 Character. Swap the base power of the selected cards with each
 * other during this battle."
 *
 * Rules: [On Your Opponent's Attack] fires when the opponent declares an attack (RL-18), before the
 * Block Step. The cost is optional ("You may") and is paid before the effect. "During this battle"
 * ends with the battle. Base power is the printed number, DON!! and other modifiers sit on top
 * (CR 4-9-2). The Character picked may be Law himself.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chr,
  decision,
  hand,
  kind,
  kw,
  mine,
  need,
  no,
  noDefence,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  theirs,
  trash,
  unusable,
  W,
  LW,
  yes,
  choices,
  chars,
  takeDamage,
  payHandCard,
} from './kit-w4b.ts';

const LAW = 'OP14-009';

/** p2's turn; p1 holds Law and `others`, with `handCards` in hand; p2 has `atk` as active attackers. */
function board(
  handCards: string[],
  others: (string | { card: string; rested?: boolean })[],
  atk: string[] = [W.kingdew],
  leader: string = LW.croc,
) {
  return theirs(leader, { hand: handCards, characters: [LAW, ...others] }, { characters: atk });
}

/** p2's Character `a` attacks p1's Leader; stops at the first decision p1 owes. */
function hitLeader(g: ReturnType<typeof board>, a: string = W.kingdew) {
  attack(g, at(g, 'p2', 'characters', a), g.leader('p1'));
}

/** Pay the pending trash-2 cost with these hand cards (picks only while the cost prompt is pending). */
function payTwo(g: ReturnType<typeof board>, cards: string[]) {
  for (const c of cards) {
    if (decision(g)?.kind === 'choose' && decision(g)?.purpose === 'cost') {
      payHandCard(g, g.find('p1', 'hand', c));
    }
  }
}

describe('OP14-009 Trafalgar Law: [Rush] and printed values', () => {
  it('has [Rush]: it can attack the turn it is played', () => {
    const g = mine(LW.croc, { hand: [LAW] }, {});
    playRaw(g, LAW);
    need(g, 'main', 'p1');
    const law = at(g, 'p1', 'characters', LAW);
    expect(kw(g, law)).toContain('Rush');
    expect(g.power(law)).toBe(10000);
    attack(g, law, g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });
});

describe("OP14-009 Trafalgar Law: [On Your Opponent's Attack] swap with the Leader", () => {
  it("on the opponent's attack offers the optional cost; paying 2 cards and picking a Character swaps base power with the Leader", () => {
    const g = board([W.mohji, W.bepo, W.marco], [W.oars9]);
    hitLeader(g);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payTwo(g, [W.mohji, W.bepo]);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', W.oars9)]);
    need(g, 'block', 'p1');
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.power(chr(g, 'p1', W.oars9))).toBe(5000);
    expect(trash(g)).toEqual([W.bepo, W.mohji].sort());
    expect(hand(g)).toEqual([W.marco]);
  });

  it('the Leader at 9000 stops a 7000 attacker: no damage', () => {
    const g = board([W.mohji, W.bepo, W.marco], [W.oars9]);
    hitLeader(g);
    yes(g, 'p1');
    payTwo(g, [W.mohji, W.bepo]);
    pickInst(g, [chr(g, 'p1', W.oars9)]);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('without the swap the same attacker hits the Leader (the control)', () => {
    const g = board([W.mohji, W.bepo, W.marco], [W.oars9]);
    hitLeader(g);
    no(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toEqual([]);
    // The three cards stay, plus the Life card the hit added.
    expect(hand(g)).toHaveLength(4);
    expect(hand(g)).toEqual(expect.arrayContaining([W.bepo, W.marco, W.mohji]));
  });

  it('the Character picked can be Law himself (Leader 10000, Law 5000)', () => {
    const g = board([W.mohji, W.bepo, W.marco], [W.oars9]);
    hitLeader(g);
    yes(g, 'p1');
    payTwo(g, [W.mohji, W.bepo]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LAW, W.oars9].sort());
    expect(choices(g)).not.toContain(g.leader('p1'));
    pickInst(g, [at(g, 'p1', 'characters', LAW)]);
    expect(g.power(g.leader('p1'))).toBe(10000);
    expect(g.power(at(g, 'p1', 'characters', LAW))).toBe(5000);
  });

  it('with Law as my only Character the swap is with himself: Leader 10000, Law 5000 (any prompt for the lone Character is a forced pick)', () => {
    const g = board([W.mohji, W.bepo, W.marco], []);
    hitLeader(g);
    yes(g, 'p1');
    payTwo(g, [W.mohji, W.bepo]);
    if (decision(g)?.kind === 'choose') pickInst(g, [at(g, 'p1', 'characters', LAW)]);
    need(g, 'block', 'p1');
    expect(g.power(g.leader('p1'))).toBe(10000);
    expect(g.power(at(g, 'p1', 'characters', LAW))).toBe(5000);
  });

  it('the swap lasts during the battle only: base power is back once the attack is over', () => {
    const g = board([W.mohji, W.bepo, W.marco], [W.oars9]);
    hitLeader(g);
    yes(g, 'p1');
    payTwo(g, [W.mohji, W.bepo]);
    pickInst(g, [chr(g, 'p1', W.oars9)]);
    noDefence(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p1', W.oars9))).toBe(9000);
  });

  it("a Leader that is not attacked still swaps: the attacked rested Character takes the Leader's 5000 and is K.O.'d by a 7000 attacker", () => {
    const g = board([W.mohji, W.bepo, W.marco], [{ card: W.oars9, rested: true }]);
    attack(g, at(g, 'p2', 'characters', W.kingdew), chr(g, 'p1', W.oars9));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payTwo(g, [W.mohji, W.bepo]);
    pickInst(g, [chr(g, 'p1', W.oars9)]);
    passBlock(g);
    passCounter(g);
    expect(chars(g)).toEqual([LAW]);
    expect(trash(g)).toContain(W.oars9);
  });

  it('with only 1 card in hand the cost cannot be paid: nothing is swapped', () => {
    const g = board([W.mohji], [W.oars9]);
    hitLeader(g);
    unusable(g, 'p1');
    need(g, 'block', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([W.mohji]);
  });

  it('with an empty hand the cost cannot be paid either', () => {
    const g = board([], [W.oars9]);
    hitLeader(g);
    unusable(g, 'p1');
    need(g, 'block', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('is Once Per Turn: a second attack in the same turn does not offer it again', () => {
    const g = board([W.mohji, W.bepo, W.marco, W.sai, W.blugori], [W.oars9], [W.kingdew, W.thatch]);
    hitLeader(g, W.kingdew);
    yes(g, 'p1');
    payTwo(g, [W.mohji, W.bepo]);
    pickInst(g, [chr(g, 'p1', W.oars9)]);
    noDefence(g);
    need(g, 'main', 'p2');
    hitLeader(g, W.thatch);
    // Raw check: the next decision is the Block Step, not another offer.
    expect(decision(g)?.kind).toBe('block');
    expect(hand(g)).toHaveLength(3);
  });

  it("only fires on the opponent's attack: attacking on my own turn asks nothing of me", () => {
    const g = mine(LW.croc, { characters: [LAW], hand: [W.mohji, W.bepo, W.marco] }, {});
    attack(g, at(g, 'p1', 'characters', LAW), g.leader('p2'));
    expect(decision(g)?.kind).toBe('block');
    expect(decision(g)?.player).toBe('p2');
    noDefence(g);
    expect(g.life('p2')).toBe(3);
    expect(hand(g)).toHaveLength(3);
  });

  it('a [Trigger]-less hit still goes through takeDamage normally after a declined offer', () => {
    const g = board([W.mohji, W.bepo], [], [W.kingdew]);
    hitLeader(g);
    no(g, 'p1');
    passBlock(g);
    passCounter(g);
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
    expect(kind(g)).toBe('main');
  });
});
