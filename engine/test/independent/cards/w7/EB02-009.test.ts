/**
 * EB02-009 Thousand Sunny (Stage, Red, cost 2, {Straw Hat Crew}).
 *
 * Card text: "[Activate: Main] You may rest this Stage: Give up to 1 of your currently given DON!!
 * cards to 1 of your "Straw Hat Crew" type Characters."
 *
 * Rules: CR 8-3-1 (the cost is resting this Stage, so it must be active; choosing to activate is
 * choosing to pay), CR 4-8-1 ("up to"), CR 2-4-3 (exact type: {Straw Hat Crew}), a DON!! given to a
 * card is +1000 power in its owner's turn (CR 6-5-5-2), only Characters are "Characters" (a Leader
 * is not), "your" means the controller's cards. Given DON!! stay given until the next Refresh
 * Phase (CR 6-2-3). The same-card question (giving a DON!! back to the card it is on) is not
 * asserted.
 * Scenery (printed): ST01-001 Luffy (Leader, {Straw Hat Crew}/{Supernovas}); ST01-008 Nico Robin
 * (cost 3) and ST01-010 Franky (cost 4), both {Straw Hat Crew}; OP01-023 Marco (cost 3, not
 * {Straw Hat Crew}).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  anomalies,
  BLUE,
  donOnCard,
  donTotal,
  L7,
  mayEnd,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  RED,
  restedOf,
  S7,
  toMyNextMain,
} from './kit-w7a.ts';

const ID = 'EB02-009';

function start(o: Partial<PlayerSpec> = {}, opp: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(L7.luffy, BLUE, {
      stage: ID,
      characters: [S7.shc3, S7.shc4, S7.c3],
      costArea: { active: 3, rested: 0 },
      ...o,
    }),
    side(L7.luffy, RED, opp),
  );
}

/** Activate with raw actions; the cost is resting this Stage, answered by the act itself. */
function use(g: ReturnType<typeof start>) {
  const stage = g.find('p1', 'stage', ID);
  const [ability] = offeredAbilities(g, stage);
  if (!ability) throw new Error('Thousand Sunny is not offered');
  g.act({ type: 'activate', card: stage, ability });
}

describe('EB02-009 Thousand Sunny: [Activate: Main] rest this Stage: give up to 1 given DON!! to a {Straw Hat Crew} Character', () => {
  it('printed effect: a DON!! on the Leader moves to the chosen {Straw Hat Crew} Character; the Stage is rested', () => {
    const g = start({ leader: { card: L7.luffy, don: 1 } });
    const total = donTotal(g, 'p1');
    const robin = g.find('p1', 'characters', S7.shc3);
    use(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    // Two {Straw Hat Crew} Characters remain: the destination is asked.
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([S7.shc3, S7.shc4].sort());
    pickInst(g, [robin]);
    expect(decision(g)?.kind).toBe('main');
    expect(donOnCard(g, g.leader('p1'))).toBe(0);
    expect(donOnCard(g, robin)).toBe(1);
    expect(donTotal(g, 'p1')).toBe(total);
    expect(restedOf(g, 'p1', ID)).toEqual([]); // a Stage is not in the Characters
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(anomalies(g)).toBe(0);
  });

  it('the moved DON!! is +1000 power for its new owner and -1000 for the old one, on my turn', () => {
    const g = start({ leader: { card: L7.luffy, don: 1 } });
    const robin = g.find('p1', 'characters', S7.shc3);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(robin)).toBe(5000);
    use(g);
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [robin]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(robin)).toBe(6000);
  });

  it('only one DON!! moves: a Leader with 2 given keeps 1', () => {
    const g = start({ leader: { card: L7.luffy, don: 2 } });
    const robin = g.find('p1', 'characters', S7.shc3);
    use(g);
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [robin]);
    expect(donOnCard(g, g.leader('p1'))).toBe(1);
    expect(donOnCard(g, robin)).toBe(1);
  });

  it('the DON!! may come from a Character and go to another {Straw Hat Crew} Character', () => {
    const g = start({ characters: [{ card: S7.shc3, don: 1 }, S7.shc4, S7.c3] });
    const robin = g.find('p1', 'characters', S7.shc3);
    const franky = g.find('p1', 'characters', S7.shc4);
    use(g);
    need(g, 'choose', 'p1');
    // Only the Character that holds a given DON!! can be the source.
    expect(offeredIds(g)).toEqual([S7.shc3]);
    pickInst(g, [robin]);
    // The only other {Straw Hat Crew} Character is chosen (an exact pick with one candidate may not be asked).
    if (decision(g)?.kind === 'choose') pickInst(g, [franky]);
    expect(donOnCard(g, robin)).toBe(0);
    expect(donOnCard(g, franky)).toBe(1);
  });

  it('the source needs no type: a DON!! given to Marco (not {Straw Hat Crew}) can be moved to a {Straw Hat Crew} Character', () => {
    const g = start({ characters: [{ card: S7.c3, don: 1 }, S7.shc3, S7.shc4] });
    const marco = g.find('p1', 'characters', S7.c3);
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S7.c3]);
    pickInst(g, [marco]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', S7.shc4)]);
    expect(donOnCard(g, marco)).toBe(0);
    expect(donOnCard(g, g.find('p1', 'characters', S7.shc4))).toBe(1);
  });

  it('the destination must have the {Straw Hat Crew} type: Marco and the {Straw Hat Crew} Leader are not offered', () => {
    const g = start({ leader: { card: L7.luffy, don: 1 } });
    use(g);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    const offered = offeredIds(g);
    expect(offered).not.toContain(S7.c3);
    expect(offered).toHaveLength(2);
    expect(offered.sort()).toEqual([S7.shc3, S7.shc4].sort());
    // The Leader is {Straw Hat Crew} too but is not a Character.
    const leader = g.leader('p1');
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === leader)).toBe(false);
  });

  it('a Character that is not {Straw Hat Crew} gets nothing even when it is the only Character', () => {
    const g = start({ leader: { card: L7.luffy, don: 1 }, characters: [S7.c3] });
    use(g);
    // The source may be asked; whatever happens, Marco never receives the DON!!.
    if (decision(g)?.kind === 'choose') pickInst(g, [g.leader('p1')]);
    if (decision(g)?.kind === 'choose') none(g);
    expect(donOnCard(g, g.find('p1', 'characters', S7.c3))).toBe(0);
    expect(donTotal(g, 'p1')).toBe(4);
    expect(anomalies(g)).toBe(0);
  });

  it('a rested {Straw Hat Crew} Character can receive the DON!!', () => {
    const g = start({
      leader: { card: L7.luffy, don: 1 },
      characters: [{ card: S7.shc3, rested: true }, S7.c3],
    });
    const robin = g.find('p1', 'characters', S7.shc3);
    use(g);
    pickInst(g, [g.leader('p1')]);
    if (decision(g)?.kind === 'choose') pickInst(g, [robin]);
    expect(donOnCard(g, robin)).toBe(1);
    expect(donOnCard(g, g.leader('p1'))).toBe(0);
  });

  it('"up to 1": choosing no source moves nothing, but the Stage stays rested', () => {
    const g = start({ leader: { card: L7.luffy, don: 1 } });
    use(g);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(donOnCard(g, g.leader('p1'))).toBe(1);
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
  });

  it("the opponent's given DON!! and Characters are out of reach", () => {
    const g = start(
      {},
      { leader: { card: L7.luffy, don: 2 }, characters: [{ card: S7.shc3, don: 1 }] },
    );
    use(g);
    // Nothing of mine has a given DON!!: whatever is asked, the opponent's cards are never offered.
    while (decision(g)?.kind === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(donOnCard(g, g.leader('p2'))).toBe(2);
    expect(donOnCard(g, g.find('p2', 'characters', S7.shc3))).toBe(1);
    expect(donTotal(g, 'p1')).toBe(3);
  });

  it('a rested Stage cannot be activated', () => {
    const g = start({ stage: { card: ID, rested: true }, leader: { card: L7.luffy, don: 1 } });
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toEqual([]);
  });

  it('with no DON!! given anywhere nothing moves and nothing is created', () => {
    const g = start();
    use(g);
    while (decision(g)?.kind === 'choose') none(g);
    expect(donTotal(g, 'p1')).toBe(3);
    for (const c of g.zone('p1', 'characters')) expect(c.don).toBe(0);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(anomalies(g)).toBe(0);
  });

  it('once the Stage has refreshed in my next turn it can be used again', () => {
    const g = start({ leader: { card: L7.luffy, don: 1 } });
    use(g);
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [g.find('p1', 'characters', S7.shc3)]);
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toHaveLength(1);
  });
});
