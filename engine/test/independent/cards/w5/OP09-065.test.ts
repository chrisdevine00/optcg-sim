/**
 * OP09-065 Sanji (Character, Purple, cost 7, 7000, Counter +1000, Strike, {Straw Hat Crew}).
 *
 * Card text: "[On Play] You may return 1 or more DON!! cards from your field to your DON!! deck: This
 * Character gains [Rush] during this turn. Then, rest up to 1 of your opponent's Characters with a
 * cost of 6 or less."
 *
 * Rules: CR 8-3-1 (optional cost; "if any part cannot be paid..."), CR 8-3-1-6 (DON!! return),
 * CR 10-1-1 ([Rush]), CR 4-8-1 ("up to" allows 0), CR 1-3-2-1 (resting a rested card is not
 * performed), CR 2-2-3-1 / 2-2-4-1 ("Character" means a Character in the Character area).
 */
import { describe, expect, it } from 'vitest';
import { act, canAttack, decision } from '../../helpers.ts';
import { canFinish, choices, myTurn, side } from '../kit.ts';
import {
  BLUE,
  countOptions,
  donOf,
  LW,
  no,
  onField,
  put,
  RED,
  returnDon,
  SW,
  yes,
} from './kit-w5a.ts';

const ID = 'OP09-065';

function start(
  o: {
    opp?: Parameters<typeof side>[2];
    mine?: Parameters<typeof side>[2];
  } = {},
) {
  return myTurn(
    side(LW.luffy, BLUE, {
      hand: [ID],
      costArea: { active: 10, rested: 0 },
      ...o.mine,
    }),
    side(LW.luffy, RED, { characters: [SW.sai, SW.thatch, SW.oars], ...o.opp }),
  );
}

/** Accept the cost, return 1 active DON!!, and stop at the rest pick. */
function toRestPick(g: ReturnType<typeof start>) {
  put(g, ID);
  yes(g);
  returnDon(g, 1, 'costActive');
}

describe('OP09-065 Sanji: [On Play] you may return 1+ DON!!: [Rush] this turn; rest up to 1 opposing Character, cost 6 or less', () => {
  it('pays the cost: Sanji gains [Rush] and the chosen Character (cost 6) is rested', () => {
    const g = start();
    toRestPick(g);
    const thatch = g.find('p2', 'characters', SW.thatch);
    expect(decision(g)?.kind).toBe('choose');
    act(g, { type: 'pick', choice: thatch });
    if (canFinish(g) && decision(g)?.kind === 'choose') act(g, { type: 'done' });
    expect(decision(g)?.kind).toBe('main');
    expect(g.card(thatch).rested).toBe(true);
    const sanji = g.find('p1', 'characters', ID);
    expect(g.card(sanji).keywords).toContain('Rush');
    expect(canAttack(g, sanji, g.leader('p2'))).toBe(true);
    expect(onField(g)).toBe(9);
    expect(donOf(g).deck).toBe(1);
  });

  it('cost 6 is a valid target, cost 7 is not, and a cost-2 Character is: boundary of "6 or less"', () => {
    const g = start();
    toRestPick(g);
    const offered = choices(g);
    expect(offered).toContain(g.find('p2', 'characters', SW.thatch));
    expect(offered).toContain(g.find('p2', 'characters', SW.sai));
    expect(offered).not.toContain(g.find('p2', 'characters', SW.oars));
  });

  it('only the opponent Characters are candidates: not my Characters, not either Leader', () => {
    const g = start({ mine: { characters: [SW.marco] } });
    toRestPick(g);
    const offered = choices(g);
    expect(offered).not.toContain(g.find('p1', 'characters', SW.marco));
    expect(offered).not.toContain(g.leader('p2'));
    expect(offered).not.toContain(g.leader('p1'));
    expect(offered).not.toContain(g.find('p1', 'characters', ID));
    expect(offered).toHaveLength(2);
  });

  it('"up to 1": choosing nothing rests nothing, and [Rush] is still gained', () => {
    const g = start();
    toRestPick(g);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(decision(g)?.kind).toBe('main');
    for (const c of g.zone('p2', 'characters')) expect(c.rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('declining the cost: no [Rush], nothing rested, no DON!! returned; Sanji is still played', () => {
    const g = start();
    put(g, ID);
    no(g);
    expect(decision(g)?.kind).toBe('main');
    const sanji = g.find('p1', 'characters', ID);
    expect(g.card(sanji).keywords).not.toContain('Rush');
    expect(canAttack(g, sanji, g.leader('p2'))).toBe(false);
    for (const c of g.zone('p2', 'characters')) expect(c.rested).toBe(false);
    expect(onField(g)).toBe(10);
  });

  it('"1 or more": the count offered runs from 1 to every DON!! on the field (10)', () => {
    const g = start();
    put(g, ID);
    yes(g);
    expect(
      countOptions(g)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('returning several DON!! pays all of them and gives the same one-time benefits', () => {
    const g = start();
    put(g, ID);
    yes(g);
    returnDon(g, 4, 'costRested');
    expect(onField(g)).toBe(6);
    expect(donOf(g).deck).toBe(4);
    act(g, { type: 'pick', choice: g.find('p2', 'characters', SW.thatch) });
    if (canFinish(g) && decision(g)?.kind === 'choose') act(g, { type: 'done' });
    expect(g.card(g.find('p2', 'characters', SW.thatch)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('with no Character of cost 6 or less on their side: [Rush] is still gained, nothing is rested', () => {
    const g = start({ opp: { characters: [SW.oars] } });
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    // Whether an empty "up to" pick is shown is the engine's choice; both must leave the same result.
    if (decision(g)?.kind === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(decision(g)?.kind).toBe('main');
    expect(g.card(g.find('p2', 'characters', SW.oars)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('with [Rush], Sanji can attack a Character the effect just rested', () => {
    const g = start();
    toRestPick(g);
    const thatch = g.find('p2', 'characters', SW.thatch);
    act(g, { type: 'pick', choice: thatch });
    if (canFinish(g) && decision(g)?.kind === 'choose') act(g, { type: 'done' });
    const sanji = g.find('p1', 'characters', ID);
    expect(canAttack(g, sanji, thatch)).toBe(true);
    // An active Character cannot be attacked.
    expect(canAttack(g, sanji, g.find('p2', 'characters', SW.oars))).toBe(false);
  });

  it('the cost is the current one: with an opposing OP09-061 Leader (+1 cost) a printed cost 6 Character is cost 7 and is not a target', () => {
    const g = myTurn(side(LW.luffy, BLUE, { hand: [ID], costArea: { active: 10, rested: 0 } }), {
      ...side(LW.luffy, RED, { characters: [SW.thatch, SW.kingdew] }),
      leader: { card: 'OP09-061', don: 1 },
    });
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    // Kingdew (printed 5) is cost 6: a target. Thatch (printed 6) is cost 7: not.
    expect(choices(g)).toEqual([g.find('p2', 'characters', SW.kingdew)]);
  });
});
