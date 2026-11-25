/**
 * ST24-005 X.Drake (Character, Green, cost 5, 5000, Counter +2000, {Drake Pirates}/{Navy}/{Supernovas}).
 *
 * Card text: [On Play] If your Leader has the "Supernovas" type, rest up to 1 of your opponent's
 * Characters with a cost of 5 or less. Then, set up to 1 of your DON!! cards as active at the end
 * of this turn.
 *
 * A "Then" after a failed "If" does not resolve (M4b-5), so a Leader without the type gets neither
 * part. The DON!! count question may be asked when the effect resolves or at the end of the turn;
 * the tests answer it wherever it appears.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import { atMain, mine, need, none, offeredIds, pickInst, settleOrders } from '../op17/kit-op17b.ts';
import {
  countIfAsked,
  donSum,
  handInstances,
  inst,
  kind,
  LC,
  playRaw,
  rested,
  SCL,
} from './kit-lfc.ts';

const DRAKE = 'ST24-005';

function game(leader: string, p2chars: string[] = [SCL.c2, SCL.c5, SCL.c6]) {
  return mine(
    leader,
    { hand: [DRAKE], costArea: { active: 6, rested: 0 } },
    { characters: p2chars },
  );
}

/** After the On Play, answer a count question if one is pending; the game returns to Main. */
function settleOnPlay(g: ReturnType<typeof game>, n = 1) {
  settleOrders(g);
  countIfAsked(g, n);
}

function endTurnAnswering(g: ReturnType<typeof game>, n = 1) {
  act(g, { type: 'endTurn' });
  for (let i = 0; i < 4; i++) {
    settleOrders(g);
    if (!countIfAsked(g, n)) break;
  }
}

describe('ST24-005 X.Drake: with a "Supernovas" Leader, rest a cost 5 or less Character; set a DON!! active at the end of the turn', () => {
  it('offers the opposing Characters with cost 5 or less (not the cost 6 one) and rests the chosen one', () => {
    const g = game(LC.nova);
    playRaw(g, DRAKE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCL.c2, SCL.c5].sort());
    const t = inst(g, 'p2', 'characters', SCL.c5);
    pickInst(g, [t]);
    settleOnPlay(g);
    expect(atMain(g)).toBe(true);
    expect(rested(g, t)).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', SCL.c6))).toBe(false);
  });

  it('the DON!! is not set active at once: during the Main Phase the 5 DON!! paid stay rested', () => {
    const g = game(LC.nova);
    playRaw(g, DRAKE);
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c5)]);
    settleOnPlay(g);
    expect(atMain(g)).toBe(true);
    expect(donSum(g)).toMatchObject({ active: 1, rested: 5 });
  });

  it('at the end of the turn one rested DON!! becomes active', () => {
    const g = game(LC.nova);
    playRaw(g, DRAKE);
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c5)]);
    settleOnPlay(g);
    endTurnAnswering(g);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
  });

  it('with a Leader without the "Supernovas" type: no rest, no prompt, and no DON!! is set active (the Then is part of the If)', () => {
    const g = game(LC.plain);
    playRaw(g, DRAKE);
    expect(atMain(g)).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', SCL.c5))).toBe(false);
    endTurnAnswering(g);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 1, rested: 5 });
  });

  it('"up to 1": choosing no Character still sets the DON!! active at the end of the turn', () => {
    const g = game(LC.nova);
    playRaw(g, DRAKE);
    need(g, 'choose', 'p1');
    none(g);
    settleOnPlay(g);
    expect(rested(g, inst(g, 'p2', 'characters', SCL.c5))).toBe(false);
    endTurnAnswering(g);
    expect(donSum(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
  });

  it('with no Character of cost 5 or less the rest part has no target, yet the DON!! part still resolves', () => {
    const g = game(LC.nova, [SCL.c6, SCL.c8]);
    playRaw(g, DRAKE);
    // No candidate: the engine may skip the pick or ask an empty one.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOnPlay(g);
    endTurnAnswering(g);
    expect(donSum(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
  });

  it('"up to 1" DON!!: the owner may choose 0 and no DON!! is set active', () => {
    const g = game(LC.nova);
    playRaw(g, DRAKE);
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c2)]);
    settleOrders(g);
    let asked = countIfAsked(g, 0);
    act(g, { type: 'endTurn' });
    settleOrders(g);
    asked = countIfAsked(g, 0) || asked;
    expect(asked).toBe(true);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 1, rested: 5 });
  });

  it('the rested Character is not held down: it becomes active in the opponent next Refresh Phase', () => {
    const g = game(LC.nova);
    playRaw(g, DRAKE);
    const t = inst(g, 'p2', 'characters', SCL.c5);
    pickInst(g, [t]);
    settleOnPlay(g);
    endTurnAnswering(g);
    need(g, 'main', 'p2');
    expect(rested(g, t)).toBe(false);
  });

  it('LF-R2 (official ST-23 to ST-28 Q&A): the DON!! is set after every [End of Your Turn] effect, so it cannot pay one', () => {
    // EB03-018 Tashigi: [End of Your Turn] You may rest 1 of your DON!! and trash 1 card from your
    // hand: set this Character as active. Drake costs all 5 DON!!, so none is active for Tashigi.
    const g = mine(
      LC.nova,
      {
        hand: [DRAKE, SCL.c2],
        characters: [{ card: 'EB03-018', rested: true }],
        costArea: { active: 5, rested: 0 },
      },
      { characters: [] },
    );
    playRaw(g, DRAKE);
    settleOrders(g);
    expect(donSum(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
    act(g, { type: 'endTurn' });
    for (let i = 0; i < 6 && kind(g) !== 'main'; i++) {
      // No order prompt with Drake's set in it; Tashigi's cost, if asked, cannot be accepted.
      expect(kind(g)).not.toBe('order');
      if (kind(g) === 'optional') {
        expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        act(g, { type: 'optional', accept: false });
      } else countIfAsked(g, 1);
    }
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
    expect(rested(g, inst(g, 'p1', 'characters', 'EB03-018'))).toBe(true);
    expect(handInstances(g).length).toBe(1);
  });

  it('the effect is not optional: there is no yes/no question before the target pick', () => {
    const g = game(LC.nova);
    playRaw(g, DRAKE);
    const d = need(g, 'choose', 'p1');
    expect(d.kind).toBe('choose');
  });
});
