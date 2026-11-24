/**
 * EB05-046 Yamato (Character, Black, cost 4, 5000, Counter +1000, {Land of Wano}).
 *
 * Card text: "If your opponent has a Character with 8000 base power or more, this Character gains
 * [Blocker] and +3000 power.
 * [On Your Opponent's Attack] You may trash 1 card from your hand: If you have 10 or more cards in
 * your trash, your Leader's base power becomes 7000 during this turn."
 *
 * Rules: the first paragraph is a permanent effect (CR 8-1-3-3) that reads BASE power (a printed
 * 7000 Character boosted to 8000 does not count; CR 4-12/RL-33 base vs. current), CR 8-3-1-3/-4
 * (cost), CR 8-3-3 ("if" read after the cost: the trashed card counts toward the 10), RL-34
 * ([On Your Opponent's Attack] timing, before the Block Step), RL-09 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, fill, passBlock, passCounter } from '../../helpers.ts';
import {
  BLUE,
  blockers,
  CH,
  decision,
  drive,
  kind,
  LD,
  mine,
  RED,
  side,
  theirTurn,
} from './kit-b.ts';

const ID = 'EB05-046';

function def(o: {
  opp?: (string | { card: string; don?: number })[];
  trash?: number;
  hand?: string[];
  own?: (string | { card: string; rested?: boolean })[];
}) {
  return theirTurn(
    side(LD.shc, BLUE, {
      characters: [ID, ...(o.own ?? [])],
      hand: o.hand ?? [CH.mohji],
      trash: fill(CH.sai, o.trash ?? 9),
    }),
    side(LD.shc, RED, { characters: o.opp ?? [CH.hajrudin] }),
  );
}

describe('EB05-046 Yamato: opposing Character with 8000+ base power: [Blocker] and +3000', () => {
  it('opposing Thatch (8000 base): Yamato has [Blocker], is 8000, and is offered as a blocker', () => {
    const g = def({ opp: [CH.thatch, CH.marco] });
    const yamato = g.find('p1', 'characters', ID);
    expect(g.card(yamato).keywords).toContain('Blocker');
    expect(g.power(yamato)).toBe(8000);
    attack(g, g.find('p2', 'characters', CH.marco), g.leader('p1'));
    drive(g, 'p1', { use: [false] });
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([yamato]);
  });

  it('boundary: a 7000-base Character does not trigger it (no [Blocker], 5000)', () => {
    const g = def({ opp: [CH.kingdew] });
    const yamato = g.find('p1', 'characters', ID);
    expect(g.card(yamato).keywords).not.toContain('Blocker');
    expect(g.power(yamato)).toBe(5000);
  });

  it('a 9000-base Character also triggers it (8000 or more)', () => {
    const g = def({ opp: [CH.littleOars] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(8000);
  });

  it('BASE power: a 7000-base Character that is 8000 through a given DON!! does not count', () => {
    const g = def({ opp: [{ card: CH.kingdew, don: 1 }] });
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(8000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('only the opponent’s Characters count: my own 8000-base Character does nothing for Yamato', () => {
    const g = def({ opp: [CH.marco], own: [CH.thatch] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('the opposing Leader (5000 base) is not a Character: nothing without a big Character', () => {
    const g = def({ opp: [] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });
});

describe("EB05-046 Yamato [On Your Opponent's Attack]: trash 1: with 10+ cards in trash, Leader base power 7000", () => {
  function attackIt(g: ReturnType<typeof def>, target?: string) {
    attack(g, g.find('p2', 'characters', CH.hajrudin), target ?? g.leader('p1'));
  }

  it('9 cards in trash + the trashed card = 10: my Leader becomes 7000 and a 6000 attacker is stopped', () => {
    const g = def({ trash: 9 });
    attackIt(g);
    drive(g, 'p1', { cost: [g.find('p1', 'hand', CH.mohji)] });
    expect(g.power(g.leader('p1'))).toBe(7000);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: 8 in trash + the trashed card = 9 is not enough: Leader stays 5000 and the 6000 attack lands', () => {
    const g = def({ trash: 8 });
    attackIt(g);
    drive(g, 'p1', { cost: [g.find('p1', 'hand', CH.mohji)] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the optional trash: Leader stays 5000 and the hand card stays', () => {
    const g = def({ trash: 9 });
    attackIt(g);
    drive(g, 'p1', { use: [false] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid: no change', () => {
    const g = def({ trash: 12, hand: [] });
    attackIt(g);
    drive(g, 'p1', {});
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it also fires when the attack is aimed at one of my Characters', () => {
    const g = def({ trash: 9, own: [{ card: CH.sai, rested: true }] });
    attackIt(g, g.find('p1', 'characters', CH.sai));
    drive(g, 'p1', { cost: [g.find('p1', 'hand', CH.mohji)] });
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('RL-09: the 7000 lasts only this turn (the Leader is 5000 again on my own turn)', () => {
    const g = def({ trash: 9 });
    attackIt(g);
    drive(g, 'p1', { cost: [g.find('p1', 'hand', CH.mohji)] });
    passBlock(g);
    passCounter(g);
    endTurn(g);
    expect(decision(g)?.player).toBe('p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it is only for the opponent’s attacks: no question when my own Character attacks', () => {
    const g = mine(
      LD.shc,
      { characters: [ID, CH.marco], hand: [CH.mohji], trash: fill(CH.sai, 9) },
      { characters: [CH.hajrudin] },
    );
    attack(g, g.find('p1', 'characters', CH.marco), g.leader('p2'));
    expect(kind(g)).not.toBe('optional');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
