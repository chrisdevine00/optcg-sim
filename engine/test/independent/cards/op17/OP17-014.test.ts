/**
 * OP17-014 Whitey Bay (Character, Red, cost 1, 1000, Counter +1000, {Whitebeard Pirates Allies},
 * Slash).
 *
 * Card text: "[On Play] K.O. up to 1 of your opponent's Characters with 2000 base power or less.
 * [On Your Opponent's Attack] You may trash this Character: Your Leader gains +1000 power during
 * this battle."
 *
 * Rules: CR 10-2-1 (K.O.), CR 4-9-2 (base power), CR 8-4-4-1 ("up to"), CR 10-2-16 / RD 89 ([On Your
 * Opponent's Attack] activates whatever the target is), CR 8-3-1-4 (an optional cost), RL-08 ("during
 * this battle"), CR 10-2-1-1 (trashing as a cost is not a K.O.).
 */
import { describe, expect, it } from 'vitest';
import { fill, passCounter } from '../../helpers.ts';
import {
  accept,
  attack,
  BLUE,
  charsOf,
  choiceCards,
  choose,
  chooseNone,
  decline,
  decider,
  expectMain,
  hand,
  kind,
  LD,
  lp,
  mine,
  noDefence,
  offered,
  passBlock,
  playCard,
  SC2,
  theirs,
  trash,
  WB,
} from './kit-op17a.ts';

const BAY = 'OP17-014';

describe('OP17-014 Whitey Bay: [On Play] K.O. up to 1 opposing Character with 2000 base power or less', () => {
  function play(opp: string[]) {
    const g = mine(LD.luffy, { hand: [BAY] }, { characters: opp });
    playCard(g, BAY);
    return g;
  }

  it('K.O.s the chosen 2000-power Character', () => {
    const g = play([SC2.dadan2000]);
    choose(g, [g.find('p2', 'characters', SC2.dadan2000)]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SC2.dadan2000]);
  });

  it('boundary: 2000 and 0 base power are offered, 3000 is not', () => {
    const g = play([SC2.dadan2000, SC2.cobra0, SC2.komachiyo]);
    expect(choiceCards(g)).toEqual([SC2.cobra0, SC2.dadan2000].sort());
  });

  it('CR 8-4-4-1 "up to 1": may K.O. nobody', () => {
    const g = play([SC2.dadan2000]);
    chooseNone(g);
    expect(charsOf(g, 'p2')).toEqual([SC2.dadan2000]);
  });

  it('with no candidate nothing is asked', () => {
    const g = play([SC2.komachiyo]);
    expectMain(g);
    expect(charsOf(g, 'p2')).toEqual([SC2.komachiyo]);
  });
});

describe('OP17-014 Whitey Bay: [On Your Opponent’s Attack] trash this Character: Leader +1000 during this battle', () => {
  function defending(
    chars: (string | { card: string; rested: boolean })[] = [BAY],
    inHand: string[] = [],
  ) {
    return theirs(
      LD.luffy,
      { hand: inHand, characters: chars, life: fill(BLUE, 4) },
      { characters: [WB.kingdew] },
    );
  }

  it('trashing it gives the Leader +1000 (6000): the opponent’s 5000 Leader attack no longer connects', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(lp(g, 'p1')).toBe(6000);
    expect(charsOf(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([BAY]);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('control: without using it the same attack connects (tie 5000 vs 5000)', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    decline(g);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });

  it('CR 8-3-1-4: declining keeps Whitey Bay on the field and gives no boost', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    decline(g);
    expect(lp(g, 'p1')).toBe(5000);
    expect(charsOf(g, 'p1')).toEqual([BAY]);
  });

  it('a RESTED Whitey Bay can still be trashed as the cost', () => {
    const g = defending([{ card: BAY, rested: true }]);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(lp(g, 'p1')).toBe(6000);
  });

  it('activates when ANOTHER Character of mine is attacked: the Leader still gains +1000', () => {
    const g = defending([BAY, { card: WB.jil, rested: true }]);
    attack(g, g.find('p2', 'characters', WB.kingdew), g.find('p1', 'characters', WB.jil));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(lp(g, 'p1')).toBe(6000);
    expect(charsOf(g, 'p1')).toEqual([WB.jil]);
  });

  it('CR 7-1-1-4: when Whitey Bay is the attacked Character and trashes itself, the battle ends: no damage to my Leader', () => {
    const g = defending([{ card: BAY, rested: true }]);
    attack(g, g.find('p2', 'characters', WB.kingdew), g.find('p1', 'characters', BAY));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expectMain(g, 'p2');
    expect(g.life('p1')).toBe(4);
    expect(charsOf(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([BAY]);
  });

  it('RL-08: the boost ends with the battle', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    passBlock(g);
    expect(lp(g, 'p1')).toBe(6000);
    passCounter(g);
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('it boosts only the Leader (not a Character) and only by 1000', () => {
    const g = defending([BAY, { card: WB.jil, rested: true }]);
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    expect(g.power(g.find('p1', 'characters', WB.jil))).toBe(6000);
    expect(lp(g, 'p1')).toBe(6000);
  });

  it('two Whitey Bays are two separate effects: both can be used in the same battle (+2000)', () => {
    const g = defending([BAY, BAY]);
    attack(g, g.leader('p2'), g.leader('p1'));
    let used = 0;
    for (let i = 0; i < 4 && decider(g) === 'p1' && kind(g) !== 'block'; i++) {
      if (kind(g) === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
      else if (offered(g, 'p1')) {
        accept(g);
        used++;
      } else break;
    }
    expect(used).toBe(2);
    expect(lp(g, 'p1')).toBe(7000);
    expect(charsOf(g, 'p1')).toEqual([]);
  });

  it('not on my own attack: nothing is asked of me when I attack', () => {
    const g = mine(LD.luffy, { characters: [BAY, WB.kingdew] });
    attack(g, g.find('p1', 'characters', WB.kingdew), g.leader('p2'));
    expect(decider(g)).toBe('p2');
    expect(charsOf(g, 'p1')).toContain(BAY);
  });

  it('trashing is not a K.O.: it works alongside my other Characters and my hand is untouched', () => {
    const g = defending([BAY], [WB.doma]);
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    expect(hand(g)).toEqual([WB.doma]);
  });
});
