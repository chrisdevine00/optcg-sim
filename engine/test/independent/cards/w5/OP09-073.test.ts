/**
 * OP09-073 Brook (Character, Purple, cost 6, 7000, Counter +1000, Slash, {Straw Hat Crew}).
 *
 * Card text: "[When Attacking] You may return 1 or more DON!! cards from your field to your DON!! deck:
 * Give up to 2 of your opponent's Characters -2000 power during this turn."
 *
 * Rules: CR 7-1-1-3 ([When Attacking] activates in the Attack Step), CR 8-3-1 / 8-3-1-6 (optional
 * cost, DON!! return), CR 1-3-6-1 (power can be negative; the card stays), CR 6-6-1-3 ("during this
 * turn" ends in the End Phase), CR 7-1-4-1 (attacker wins on a tie).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, decision, endTurn, passBlock, passCounter } from '../../helpers.ts';
import { canFinish, choices, myTurn, side } from '../kit.ts';
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

const ID = 'OP09-073';

function start(o: { opp?: string[]; active?: number; rested?: number; oppRested?: boolean } = {}) {
  return myTurn(
    side(LW.luffy, BLUE, {
      characters: [ID, SW.marco],
      costArea: { active: o.active ?? 4, rested: o.rested ?? 0 },
    }),
    side(LW.luffy, RED, {
      characters: (o.opp ?? [SW.sai, SW.kingdew]).map((card) => ({
        card,
        rested: o.oppRested ?? false,
      })),
    }),
  );
}

/** Brook attacks the opponent Leader, I accept and return `n` DON!!; stops at the target pick. */
function toTargets(g: ReturnType<typeof start>, n = 1) {
  attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
  yes(g, 'p1');
  returnDon(g, n, 'costActive');
}

describe('OP09-073 Brook: [When Attacking] you may return 1+ DON!!: up to 2 opposing Characters -2000 power this turn', () => {
  it('pays the cost and gives each of 2 chosen Characters -2000 power', () => {
    const g = start();
    const sai = g.find('p2', 'characters', SW.sai);
    const kingdew = g.find('p2', 'characters', SW.kingdew);
    toTargets(g);
    need(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual([sai, kingdew].sort());
    act(g, { type: 'pick', choice: sai });
    act(g, { type: 'pick', choice: kingdew });
    if (decision(g)?.kind === 'choose' && canFinish(g)) act(g, { type: 'done' });
    expect(g.power(sai)).toBe(2000);
    expect(g.power(kingdew)).toBe(5000);
    expect(onField(g)).toBe(3);
    expect(donOf(g).deck).toBe(7);
    // The attack carries on to the Block Step.
    need(g, 'block', 'p2');
  });

  it('"up to 2": choosing 1 changes only that Character, and choosing none changes nothing', () => {
    const g = start();
    const sai = g.find('p2', 'characters', SW.sai);
    const kingdew = g.find('p2', 'characters', SW.kingdew);
    toTargets(g);
    act(g, { type: 'pick', choice: kingdew });
    if (decision(g)?.kind === 'choose') act(g, { type: 'done' });
    expect(g.power(sai)).toBe(4000);
    expect(g.power(kingdew)).toBe(5000);

    const h = start();
    toTargets(h);
    expect(canFinish(h)).toBe(true);
    act(h, { type: 'done' });
    expect(h.power(h.find('p2', 'characters', SW.sai))).toBe(4000);
    expect(h.power(h.find('p2', 'characters', SW.kingdew))).toBe(7000);
    // The cost was paid anyway.
    expect(onField(h)).toBe(3);
  });

  it('candidates are the opponent Characters only: not their Leader, not my own cards', () => {
    const g = start();
    toTargets(g);
    const offered = choices(g);
    expect(offered).not.toContain(g.leader('p2'));
    expect(offered).not.toContain(g.leader('p1'));
    expect(offered).not.toContain(g.find('p1', 'characters', SW.marco));
    expect(offered).not.toContain(g.find('p1', 'characters', ID));
    expect(offered).toHaveLength(2);
  });

  it('power can go below 0 and the Character stays on the field (0 power Cobra becomes -2000)', () => {
    const g = start({ opp: [SW.cobra] });
    const cobra = g.find('p2', 'characters', SW.cobra);
    expect(g.power(cobra)).toBe(0);
    toTargets(g);
    act(g, { type: 'pick', choice: cobra });
    if (decision(g)?.kind === 'choose') act(g, { type: 'done' });
    expect(g.power(cobra)).toBe(-2000);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('the reduction lasts this turn only: at the opponent next Main Phase the power is back', () => {
    const g = start();
    const sai = g.find('p2', 'characters', SW.sai);
    toTargets(g);
    act(g, { type: 'pick', choice: sai });
    if (decision(g)?.kind === 'choose') act(g, { type: 'done' });
    expect(g.power(sai)).toBe(2000);
    passBlock(g);
    passCounter(g);
    expect(g.power(sai)).toBe(2000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(sai)).toBe(4000);
  });

  it('the cost is paid first: a rested opposing Character with 9000 -2000 is beaten by a 7000 Brook (tie wins)', () => {
    const g = myTurn(
      side(LW.luffy, BLUE, { characters: [ID], costArea: { active: 2, rested: 0 } }),
      side(LW.luffy, RED, { characters: [{ card: SW.oars, rested: true }] }),
    );
    const oars = g.find('p2', 'characters', SW.oars);
    attack(g, g.find('p1', 'characters', ID), oars);
    yes(g, 'p1');
    returnDon(g, 1, 'costActive');
    act(g, { type: 'pick', choice: oars });
    if (decision(g)?.kind === 'choose') act(g, { type: 'done' });
    expect(g.power(oars)).toBe(7000);
    passBlock(g);
    passCounter(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('declining the cost: no power change, no DON!! returned, the attack goes on', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    no(g, 'p1');
    expect(g.power(g.find('p2', 'characters', SW.sai))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', SW.kingdew))).toBe(7000);
    expect(onField(g)).toBe(4);
    need(g, 'block', 'p2');
  });

  it('"1 or more": the count offered runs from 1 to every DON!! on my field', () => {
    const g = start({ active: 3, rested: 1 });
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    yes(g, 'p1');
    expect(
      countOptions(g)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([1, 2, 3, 4]);
  });

  it('with no DON!! on my field the cost cannot be paid and the attack just goes on', () => {
    const g = start({ active: 0, rested: 0 });
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    unusable(g, 'p1');
    expect(g.power(g.find('p2', 'characters', SW.sai))).toBe(4000);
    need(g, 'block', 'p2');
  });

  it('it is a [When Attacking]: nothing asked on a Brook that does not attack', () => {
    const g = start();
    // Another Character attacks; Brook's effect must not be asked.
    attack(g, g.find('p1', 'characters', SW.marco), g.leader('p2'));
    need(g, 'block', 'p2');
  });
});
