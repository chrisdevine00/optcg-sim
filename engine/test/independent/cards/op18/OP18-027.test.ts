/**
 * OP18-027 Zoro & Sogeking (Character, Green, cost 5, 6000, no Counter, {Sniper Island}/{Water
 * Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[Opponent's Turn] The base power of your active [Monkey.D.Luffy] Leader with 3 or more DON!!
 *    cards given becomes 7000.
 *    [On Play] Set up to 2 of your DON!! cards as active. Then, up to 1 of your opponent's
 *    Characters with a cost of 6 or less cannot be rested until the end of your opponent's next
 *    End Phase."
 *
 * Rules used: DON!! given to a Leader add +1000 only during its owner's turn (CR 6-5-5-2), so on
 * the opponent's turn the base 7000 is the whole power. "Set up to N" asks a count (OP14-R2).
 * "Cannot be rested" also stops the Character attacking (rules-digest 57). Duration: until the end
 * of the opponent's next End Phase (RL-11).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence } from '../../helpers.ts';
import {
  canAttackAnything,
  CH,
  choices,
  donOf,
  kind,
  LDR,
  mine,
  need,
  pickInst,
  pickCount,
  playCard,
  RED,
  BLUE,
  side,
  skipPick,
  theirTurn,
  atMain,
  type Chars,
} from './kit-ga.ts';

const ZS = 'OP18-027';

/** p2's turn (p1 defends): p1's Leader `leader` with `don` DON!! given, Zoro & Sogeking on the field. */
function defending(leader: string, don: number, rested = false, chars: Chars = [ZS]) {
  return theirTurn(
    { ...side(LDR.luffy, BLUE, { characters: chars }), leader: { card: leader, don, rested } },
    side(LDR.kid, RED, { characters: [CH.hajrudin4] }),
  );
}

describe('OP18-027 Zoro & Sogeking: [Opponent’s Turn] the Luffy Leader’s base power becomes 7000', () => {
  it('happy path: [Monkey.D.Luffy] Leader, active, 3 DON!! given: 7000 on the opponent’s turn', () => {
    const g = defending(LDR.luffy, 3);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('it matters in battle: a 6000 attacker (5000 + 1000 would hit) is stopped by the 7000 Leader', () => {
    const g = defending(LDR.luffy, 3);
    attack(g, g.find('p2', 'characters', CH.hajrudin4), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('"3 or more": with 4 DON!! given the base is still 7000 (the DON!! add nothing on the opponent’s turn)', () => {
    const g = defending(LDR.luffy, 4);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('boundary: with 2 DON!! given the Leader stays at its printed 5000', () => {
    const g = defending(LDR.luffy, 2);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"active": a rested Luffy Leader keeps 5000', () => {
    const g = defending(LDR.luffy, 3, true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Monkey.D.Luffy] by name: a Leader with another name (Kid) with 3 DON!! given keeps 5000', () => {
    const g = defending(LDR.kid, 3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 2-8-2: without Zoro & Sogeking on the field the Leader is at 5000', () => {
    const g = defending(LDR.luffy, 3, false, [CH.usopp3]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"[Opponent’s Turn]": on p1’s own turn the Leader is 5000 + 3000 from the DON!!, not 7000 + 3000', () => {
    const g = mine(
      { card: LDR.luffy, don: 3 },
      { characters: [ZS], costArea: { active: 7, rested: 0 } },
    );
    expect(g.power(g.leader('p1'))).toBe(8000);
  });
});

describe('OP18-027 Zoro & Sogeking: [On Play] set up to 2 DON!! as active, then restrict an opponent Character', () => {
  const play = (p2: Chars = [CH.kingdew5]) => {
    const g = mine(
      LDR.luffy,
      { hand: [ZS], costArea: { active: 6, rested: 3 } },
      { characters: p2 },
    );
    playCard(g, ZS);
    return g;
  };

  it('"up to 2": choosing 2 sets two rested DON!! as active (after paying 5 for the card)', () => {
    const g = play();
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 8 });
    pickCount(g, 2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 6 });
  });

  it('"up to": choosing 1 sets just one', () => {
    const g = play();
    pickCount(g, 1);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 7 });
  });

  it('"up to": choosing none sets none, and the "Then" part still applies', () => {
    const g = play();
    pickCount(g, 0);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 8 });
    expect(kind(g)).toBe('choose');
    pickInst(g, [g.find('p2', 'characters', CH.kingdew5)]);
    expect(atMain(g)).toBe(true);
  });

  it('only rested DON!! can be set: with all DON!! active the effect changes nothing', () => {
    const g = mine(
      LDR.luffy,
      { hand: [ZS], costArea: { active: 10, rested: 0 } },
      { characters: [CH.kingdew5] },
    );
    playCard(g, ZS);
    // Five DON!! were rested for the cost; they can be set back, never more than 2.
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
    pickCount(g, 2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 7, rested: 3 });
  });

  it('the targeted Character (cost 6, the boundary) cannot attack on the opponent’s next turn', () => {
    const g = play([CH.thatch6]);
    pickCount(g, 0);
    expect(choices(g)).toEqual([g.find('p2', 'characters', CH.thatch6)]);
    pickInst(g, [g.find('p2', 'characters', CH.thatch6)]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, g.find('p2', 'characters', CH.thatch6))).toBe(false);
  });

  it('cost boundary: a cost 7 Character is not offered', () => {
    const g = play([CH.thatch6, 'OP02-020']);
    pickCount(g, 0);
    expect(choices(g)).toEqual([g.find('p2', 'characters', CH.thatch6)]);
  });

  it('"up to 1": the target may be skipped, then the opponent’s Character can attack normally', () => {
    const g = play([CH.thatch6]);
    pickCount(g, 0);
    skipPick(g);
    act(g, { type: 'endTurn' });
    expect(canAttackAnything(g, g.find('p2', 'characters', CH.thatch6))).toBe(true);
  });

  it('only the chosen Character is restricted; another opposing Character can still attack', () => {
    const g = play([CH.thatch6, CH.kingdew5]);
    pickCount(g, 0);
    pickInst(g, [g.find('p2', 'characters', CH.thatch6)]);
    act(g, { type: 'endTurn' });
    expect(canAttackAnything(g, g.find('p2', 'characters', CH.thatch6))).toBe(false);
    expect(canAttackAnything(g, g.find('p2', 'characters', CH.kingdew5))).toBe(true);
  });

  it('duration: ends with the opponent’s next End Phase, so it can attack in the following opponent turn', () => {
    const g = play([CH.thatch6]);
    pickCount(g, 0);
    pickInst(g, [g.find('p2', 'characters', CH.thatch6)]);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' }); // p2 ends its restricted turn
    need(g, 'main', 'p1');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, g.find('p2', 'characters', CH.thatch6))).toBe(true);
  });

  it('the opponent’s Leader is not a target (Characters only)', () => {
    const g = play([CH.thatch6]);
    pickCount(g, 0);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('nothing to restrict (no opposing Character): the DON!! still set and no target question', () => {
    const g = play([]);
    pickCount(g, 2);
    if (kind(g) === 'choose') skipPick(g);
    expect(atMain(g)).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3 });
  });
});
