/**
 * OP17-001 Edward.Newgate (Leader, Red, 5000, 5 Life, {The Four Emperors}/{Whitebeard Pirates}).
 *
 * Card text: "[On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your hand: Up to 1
 * of your Leader or Characters gains +4000 power during this battle."
 *
 * Rules: CR 10-2-16 / RD 89 ([On Your Opponent's Attack] activates whatever the target is), CR 10-2-13
 * ([Once Per Turn]), CR 8-3-1-3/-4 (costs), CR 8-4-4-1 ("up to"), RL-08 ("during this battle").
 */
import { describe, expect, it } from 'vitest';
import { fill, passCounter } from '../../helpers.ts';
import {
  accept,
  attack,
  BLUE,
  choices,
  choose,
  chooseNone,
  decider,
  decline,
  endTurn,
  expectMain,
  hand,
  kind,
  LD,
  lp,
  mine,
  noDefence,
  offered,
  passBlock,
  payWith,
  RED,
  reachablePickSets,
  skipUnusable,
  theirs,
  trash,
  VAN,
  WB,
} from './kit-op17a.ts';

const LEAD = LD.newgate;

function defending(
  inHand: string[] = [VAN.mohji],
  chars: (string | { card: string; rested: boolean })[] = [],
) {
  return theirs(
    LEAD,
    { hand: inHand, characters: chars, life: fill(RED, 4) },
    { characters: [WB.kingdew, WB.thatch] },
  );
}
const toLeader = (g: ReturnType<typeof defending>, attacker = g.leader('p2')) =>
  attack(g, attacker, g.leader('p1'));

/** Say yes to the cost, trash the (only) hand card, and give the +4000 to `target`. */
function use(g: ReturnType<typeof defending>, target: string) {
  accept(g);
  payWith(g, [g.zone('p1', 'hand')[0]!.instance]);
  choose(g, [target]);
}

describe('OP17-001 Edward.Newgate: [On Your Opponent’s Attack] [Once Per Turn] trash 1: Leader or Character +4000 during this battle', () => {
  it('trashing 1 card gives the attacked Leader +4000 (9000), so a 5000 attacker deals no damage', () => {
    const g = defending();
    toLeader(g);
    expect(offered(g, 'p1')).toBe(true);
    use(g, g.leader('p1'));
    expect(lp(g, 'p1')).toBe(9000);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([VAN.mohji]);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('without the effect the same 5000 attack connects (control)', () => {
    const g = defending();
    toLeader(g);
    decline(g);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });

  it('a Character can take the +4000: a rested 6000 Character survives a 7000 attacker', () => {
    const g = defending([VAN.mohji], [{ card: WB.jil, rested: true }]);
    const jil = g.find('p1', 'characters', WB.jil);
    attack(g, g.find('p2', 'characters', WB.kingdew), jil);
    expect(offered(g, 'p1')).toBe(true);
    use(g, jil);
    expect(g.power(jil)).toBe(10000);
    expect(lp(g, 'p1')).toBe(5000);
    noDefence(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([WB.jil]);
  });

  it('activates when a Character of mine is attacked and may boost the Leader instead', () => {
    const g = defending([VAN.mohji], [{ card: WB.jil, rested: true }]);
    attack(g, g.find('p2', 'characters', WB.kingdew), g.find('p1', 'characters', WB.jil));
    expect(offered(g, 'p1')).toBe(true);
    use(g, g.leader('p1'));
    expect(lp(g, 'p1')).toBe(9000);
    expect(g.power(g.find('p1', 'characters', WB.jil))).toBe(6000);
  });

  it('candidates are exactly my Leader and my Characters (not the opponent’s cards)', () => {
    const g = defending([VAN.mohji], [WB.jil]);
    toLeader(g);
    accept(g);
    payWith(g, [g.zone('p1', 'hand')[0]!.instance]);
    expect(choices(g).sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', WB.jil)].sort());
  });

  it('CR 8-4-4-1 "up to 1": after paying the cost the player may choose nobody, and at most one card gains power', () => {
    const g = defending([VAN.mohji], [WB.jil]);
    toLeader(g);
    accept(g);
    payWith(g, [g.zone('p1', 'hand')[0]!.instance]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    chooseNone(g);
    expect(lp(g, 'p1')).toBe(5000);
    expect(trash(g)).toEqual([VAN.mohji]);
  });

  it('RL-08: the +4000 ends with the battle', () => {
    const g = defending();
    toLeader(g);
    use(g, g.leader('p1'));
    passBlock(g);
    expect(lp(g, 'p1')).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('CR 8-3-1-4: declining the optional cost trashes nothing and gives no boost', () => {
    const g = defending();
    toLeader(g);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(hand(g)).toEqual([VAN.mohji]);
    expect(trash(g)).toEqual([]);
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid: no boost', () => {
    const g = defending([]);
    toLeader(g);
    skipUnusable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('CR 10-2-13: [Once Per Turn]: a second attack in the same turn does not offer it', () => {
    const g = defending([VAN.mohji, VAN.gordon]);
    toLeader(g);
    use(g, g.leader('p1'));
    noDefence(g);
    expectMain(g, 'p2');
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
    expect(kind(g)).toBe('block');
    expect(hand(g)).toHaveLength(1);
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('CR 10-2-13-3: declining does not use up the [Once Per Turn]', () => {
    const g = defending([VAN.mohji, VAN.gordon]);
    toLeader(g);
    decline(g);
    noDefence(g);
    expectMain(g, 'p2');
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
  });

  it('it is for the opponent’s attack only: my own attack asks nothing of me', () => {
    const g = mine(LEAD, { hand: [VAN.mohji], characters: [WB.kingdew] }, { characters: [] });
    attack(g, g.find('p1', 'characters', WB.kingdew), g.leader('p2'));
    expect(decider(g)).toBe('p2');
    expect(hand(g)).toEqual([VAN.mohji]);
  });

  it('the Once Per Turn resets on the next turn of the opponent', () => {
    const g = defending([VAN.mohji, VAN.gordon, BLUE]);
    toLeader(g);
    use(g, g.leader('p1'));
    noDefence(g);
    endTurn(g);
    endTurn(g);
    expectMain(g, 'p2');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
  });
});
