/**
 * OP16-113 Boa Marigold (Character, Yellow, cost 5, 5000, Counter +1000; Kuja Pirates).
 *
 * Card text:
 *   "If you have 2 or less Life cards, this Character gains [Blocker].
 *    [Trigger] If your Leader has the {Kuja Pirates} type, play this card."
 *
 * Rules: CR 8-1-3-3 permanent effect checked continuously; "2 or less" includes 0 and 2, not 3;
 * [Blocker] needs the Character active (CR 10-1-4); Trigger: CR 4-10-1.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  attack,
  blockers,
  BLUE,
  hitLeader,
  LD,
  LEAD,
  noDefence,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit-d.ts';

const MARI = 'OP16-113';

function defending(life: number, rested = false) {
  return theirTurn(
    side(LD.kuja, BLUE, { life: rep(BLUE, life), characters: [{ card: MARI, rested }] }),
    side(LEAD.luffy, RED, { characters: [VAN.thatch] }),
  );
}

describe('OP16-113 Boa Marigold: gains [Blocker] with 2 or less Life', () => {
  it('2 Life (boundary): she can block and shows the keyword', () => {
    const g = defending(2);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', MARI)]);
    expect(g.card(g.find('p1', 'characters', MARI)).keywords).toContain('Blocker');
  });

  it('3 Life (boundary): no [Blocker]', () => {
    const g = defending(3);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
    expect(g.card(g.find('p1', 'characters', MARI)).keywords).not.toContain('Blocker');
  });

  it('0 Life and 1 Life count as "2 or less"', () => {
    for (const life of [0, 1]) {
      const g = defending(life);
      attack(g, g.leader('p2'), g.leader('p1'));
      expect(blockers(g)).toEqual([g.find('p1', 'characters', MARI)]);
    }
  });

  it('it is continuous: after a hit drops Life from 3 to 2 she can block the next attack', () => {
    const g = defending(3);
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(2);
    attack(g, g.find('p2', 'characters', VAN.thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', MARI)]);
  });

  it('a rested Marigold cannot block even with 2 Life', () => {
    const g = defending(2, true);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('blocking redirects the attack: no Life is lost', () => {
    const g = defending(2);
    attack(g, g.leader('p2'), g.leader('p1'));
    g.act({ type: 'block', blocker: g.find('p1', 'characters', MARI) });
    noDefence(g);
    expect(g.life('p1')).toBe(2);
  });
});

describe('OP16-113 Boa Marigold [Trigger]: play this card if your Leader has the Kuja Pirates type', () => {
  function trig(leader: string) {
    const g = theirTurn(
      side(leader, BLUE, { life: [MARI, ...rep(BLUE, 3)] }),
      side(LEAD.luffy, RED),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('Kuja Leader: played', () => {
    expect(sortedIds(trig(LD.kuja), 'p1', 'characters')).toEqual([MARI]);
  });

  it('CR 4-10-1: Leader without the type: not played', () => {
    const g = trig(LD.navy);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
