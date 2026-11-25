/**
 * OP09-068 Tony Tony.Chopper (Character, Purple, cost 5, 6000, Counter +1000, Strike, {Animal}/
 * {Straw Hat Crew}).
 *
 * Card text: "[End of Your Turn] You may return 1 or more DON!! cards from your field to your DON!!
 * deck: Set this Character as active. Then, this Character gains [Blocker] until the end of your
 * opponent's next turn."
 *
 * Rules: CR 6-6-1-1 ([End of Your Turn] runs in the End Phase, before durations end), CR 8-3-1 /
 * 8-3-1-6 (optional cost; DON!! −N style return), CR 10-1-4 ([Blocker]), CR 6-6-1-2 ("until the end
 * of ... turn" ends in that turn's End Phase).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, decision, endTurn } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  BLUE,
  countOptions,
  donOf,
  LW,
  need,
  no,
  onField,
  RED,
  returnDon,
  SW,
  unusable,
  yes,
} from './kit-w5a.ts';

const ID = 'OP09-068';

function start(
  o: {
    rested?: boolean;
    active?: number;
    restedDon?: number;
    mine?: PlayerSpec['characters'];
  } = {},
) {
  return myTurn(
    side(LW.luffy, BLUE, {
      characters: [{ card: ID, rested: o.rested ?? true }, ...(o.mine ?? [])],
      costArea: { active: o.active ?? 3, rested: o.restedDon ?? 0 },
    }),
    side(LW.luffy, RED, { characters: [SW.sai] }),
  );
}

describe('OP09-068 Tony Tony.Chopper: [End of Your Turn] you may return 1+ DON!!: set active, [Blocker] until the end of the opponent next turn', () => {
  it('pays the cost at my End Phase: Chopper is set active and gains [Blocker]', () => {
    const g = start();
    const chopper = g.find('p1', 'characters', ID);
    expect(g.card(chopper).rested).toBe(true);
    endTurn(g);
    yes(g, 'p1');
    returnDon(g, 1, 'costActive');
    expect(g.card(chopper).rested).toBe(false);
    expect(g.card(chopper).keywords).toContain('Blocker');
    expect(onField(g)).toBe(2);
    expect(donOf(g).deck).toBe(8);
    // The turn moved on to the opponent.
    need(g, 'main', 'p2');
  });

  it('the new [Blocker] works on the opponent turn: Chopper can block an attack on my Leader', () => {
    const g = start();
    const chopper = g.find('p1', 'characters', ID);
    endTurn(g);
    yes(g, 'p1');
    returnDon(g, 1, 'costActive');
    need(g, 'main', 'p2');
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toContain(chopper);
    act(g, { type: 'block', blocker: chopper });
    // 6000 Chopper against the 5000 Leader: no Life is lost.
    expect(g.life('p1')).toBe(4);
  });

  it('declining the cost: Chopper stays rested, has no [Blocker], and no DON!! are returned', () => {
    const g = start();
    const chopper = g.find('p1', 'characters', ID);
    endTurn(g);
    no(g, 'p1');
    need(g, 'main', 'p2');
    expect(g.card(chopper).rested).toBe(true);
    expect(g.card(chopper).keywords).not.toContain('Blocker');
    expect(onField(g)).toBe(3);
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).not.toContain(chopper);
  });

  it('"1 or more": the count offered runs from 1 to every DON!! on my field', () => {
    const g = start({ active: 2, restedDon: 2 });
    endTurn(g);
    yes(g, 'p1');
    expect(
      countOptions(g)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([1, 2, 3, 4]);
  });

  it('with no DON!! on my field the cost cannot be paid: Chopper stays rested and gets no [Blocker]', () => {
    const g = start({ active: 0, restedDon: 0 });
    const chopper = g.find('p1', 'characters', ID);
    endTurn(g);
    unusable(g, 'p1');
    need(g, 'main', 'p2');
    expect(g.card(chopper).rested).toBe(true);
    expect(g.card(chopper).keywords).not.toContain('Blocker');
  });

  it('DON!! given to a Character count: the cost can be paid with a given DON!! alone', () => {
    const g = start({ active: 0, restedDon: 0, mine: [{ card: SW.marco, don: 1 }] });
    const chopper = g.find('p1', 'characters', ID);
    endTurn(g);
    yes(g, 'p1');
    returnDon(g, 1, 'given');
    expect(g.card(g.find('p1', 'characters', SW.marco)).don).toBe(0);
    expect(g.card(chopper).rested).toBe(false);
    expect(g.card(chopper).keywords).toContain('Blocker');
  });

  it('an active Chopper: the cost is still paid and [Blocker] is still gained', () => {
    const g = start({ rested: false });
    const chopper = g.find('p1', 'characters', ID);
    endTurn(g);
    yes(g, 'p1');
    returnDon(g, 1, 'costActive');
    expect(g.card(chopper).rested).toBe(false);
    expect(g.card(chopper).keywords).toContain('Blocker');
    expect(onField(g)).toBe(2);
  });

  it('[Blocker] lasts through the opponent turn and ends at the end of it', () => {
    const g = start();
    const chopper = g.find('p1', 'characters', ID);
    endTurn(g);
    yes(g, 'p1');
    returnDon(g, 1, 'costActive');
    need(g, 'main', 'p2');
    expect(g.card(chopper).keywords).toContain('Blocker');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.card(chopper).keywords).not.toContain('Blocker');
  });

  it('it does not fire in the opponent End Phase ("Your" turn only): no question is asked', () => {
    const g = start({ rested: true });
    // p1 declines at their own End Phase, then p2 ends their turn.
    endTurn(g);
    no(g, 'p1');
    need(g, 'main', 'p2');
    endTurn(g);
    // Back at p1's Main Phase with no question in between.
    expect(decision(g)?.kind).toBe('main');
    expect(decision(g)?.player).toBe('p1');
  });
});
