/**
 * EB03-018 Tashigi (Character, Green, cost 4, 6000, Slash, {Navy}).
 *
 * Card text: "[Opponent's Turn] This Character cannot be K.O.'d by your opponent's effects and gains
 * [Blocker]. [End of Your Turn] You may rest 1 of your DON!! cards and trash 1 card from your hand:
 * Set this Character as active."
 *
 * Rules: [Opponent's Turn] is a condition (CR 8-3-2-5); "cannot be K.O.'d by effects" does not stop
 * a K.O. in battle or a rest (RL-14); an auto's colon cost may be declined without "you may" and
 * cannot be paid in part (CR 8-3-1-3, 8-3-1-4); a hand cost is offered even when unpayable, with
 * "use" unavailable (DECISIONS 2026-10-29); a rested DON!! cost needs an active DON!!.
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  act,
  at,
  attack,
  blockers,
  chars,
  charIdsOf,
  decision,
  don,
  endTurn,
  hand,
  isRested,
  K,
  kind,
  KINGDOM_COME,
  LD_LF,
  mine,
  need,
  no,
  noDefence,
  opponentKingdomCome,
  opponentRests,
  EV_LF,
  payHand,
  theirs,
  trash,
  unusable,
  VAN_LF,
  yes,
} from './kit-lfa.ts';
import { donChoices } from '../kit.ts';

const TASHIGI = 'EB03-018';
const { marco, sai, thatch, mohji } = VAN_LF;

/** Answer the cost of the [End of Your Turn]: rest 1 active DON!! and trash `card` from hand. */
function payEndCost(g: TestGame, card: string) {
  for (let i = 0; i < 4; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== 'p1' || d.purpose !== 'cost') return;
    const donPick = donChoices(g).find((o) => o.from === 'costActive');
    if (donPick) act(g, { type: 'pick', choice: donPick });
    else payHand(g, [card]);
  }
}

/** p1's turn with a rested Tashigi; ends the turn and stops at the [End of Your Turn] question. */
function endWithRestedTashigi(o: { hand?: string[]; active?: number; rested?: number } = {}) {
  const g = mine(LD_LF.luffy, {
    characters: [{ card: TASHIGI, rested: true }],
    hand: o.hand ?? [sai, mohji],
    costArea: { active: o.active ?? 3, rested: o.rested ?? 0 },
  });
  endTurn(g);
  return g;
}

describe('EB03-018 Tashigi', () => {
  it('printed values: cost 4, 6000 power, no Counter', () => {
    const g = mine(LD_LF.luffy, { characters: [TASHIGI] });
    const t = at(g, 'p1', 'characters', TASHIGI);
    expect(g.card(t).cost).toBe(4);
    expect(g.power(t)).toBe(6000);
    expect(g.card(t).counter).toBeNull();
  });

  it("[Opponent's Turn]: has [Blocker] during the opponent's turn and can block", () => {
    const g = theirs(LD_LF.luffy, { characters: [TASHIGI] }, { characters: [thatch] });
    const t = at(g, 'p1', 'characters', TASHIGI);
    expect(g.card(t).keywords).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([t]);
  });

  it('on my own turn she has no [Blocker]', () => {
    const g = mine(LD_LF.luffy, { characters: [TASHIGI] });
    expect(g.card(at(g, 'p1', 'characters', TASHIGI)).keywords).not.toContain('Blocker');
  });

  it("[Opponent's Turn]: an opponent's K.O. effect cannot K.O. her", () => {
    const g = theirs(
      LD_LF.luffy,
      { characters: [TASHIGI] },
      { hand: [KINGDOM_COME], life: [mohji, mohji, mohji, mohji] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', TASHIGI));
    expect(chars(g)).toEqual([TASHIGI]);
    expect(trash(g)).toEqual([]);
  });

  it("control: another Character of mine with no protection is K.O.'d by the same effect", () => {
    const g = theirs(
      LD_LF.luffy,
      { characters: [TASHIGI, marco] },
      { hand: [KINGDOM_COME], life: [mohji, mohji, mohji, mohji] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', marco));
    expect(chars(g)).toEqual([TASHIGI]);
    expect(trash(g)).toEqual([marco]);
  });

  it('only K.O. by effects is stopped: she can still be rested by an effect', () => {
    const g = theirs(LD_LF.luffy, { characters: [TASHIGI] }, { hand: [EV_LF.restEvent] });
    const t = at(g, 'p1', 'characters', TASHIGI);
    expect(opponentRests(g, t)).toBe(true);
    expect(isRested(g, t)).toBe(true);
  });

  it('only K.O. by effects is stopped: losing a battle still K.O.s her (she blocks a 8000 attacker)', () => {
    const g = theirs(LD_LF.luffy, { characters: [TASHIGI] }, { characters: [thatch] });
    const t = at(g, 'p1', 'characters', TASHIGI);
    attack(g, at(g, 'p2', 'characters', thatch), g.leader('p1'));
    need(g, 'block', 'p1');
    act(g, { type: 'block', blocker: t });
    noDefence(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([TASHIGI]);
  });

  it('[End of Your Turn]: paying rest 1 DON!! and trash 1 card sets her active', () => {
    const g = endWithRestedTashigi({ hand: [sai, mohji], active: 3 });
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    yes(g, 'p1');
    payEndCost(g, sai);
    need(g, 'main', 'p2');
    expect(isRested(g, at(g, 'p1', 'characters', TASHIGI))).toBe(false);
    expect(hand(g)).toEqual([mohji]);
    expect(trash(g)).toEqual([sai]);
  });

  it('the cost rests exactly 1 DON!! (it is not a DON!! −1)', () => {
    const g = endWithRestedTashigi({ hand: [sai, mohji], active: 3, rested: 0 });
    yes(g, 'p1');
    payEndCost(g, sai);
    need(g, 'main', 'p2');
    // p2's turn: p1's DON!! are unchanged in number (the refresh is p1's, not p2's).
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('declining: she stays rested, nothing is trashed, no DON!! is rested', () => {
    const g = endWithRestedTashigi();
    need(g, 'optional', 'p1');
    no(g, 'p1');
    need(g, 'main', 'p2');
    expect(isRested(g, at(g, 'p1', 'characters', TASHIGI))).toBe(true);
    expect(hand(g)).toEqual([mohji, sai].sort());
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
  });

  it('boundary: exactly 1 active DON!! and exactly 1 card in hand can pay', () => {
    const g = endWithRestedTashigi({ hand: [sai], active: 1, rested: 4 });
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    yes(g, 'p1');
    payEndCost(g, sai);
    need(g, 'main', 'p2');
    expect(isRested(g, at(g, 'p1', 'characters', TASHIGI))).toBe(false);
    expect(hand(g)).toEqual([]);
  });

  it('an empty hand: the cost cannot be paid, she stays rested', () => {
    const g = endWithRestedTashigi({ hand: [], active: 3 });
    unusable(g, 'p1');
    need(g, 'main', 'p2');
    expect(isRested(g, at(g, 'p1', 'characters', TASHIGI))).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
  });

  it('no active DON!! (all rested): the cost cannot be paid, the hand card is kept', () => {
    const g = endWithRestedTashigi({ hand: [sai], active: 0, rested: 4 });
    unusable(g, 'p1');
    need(g, 'main', 'p2');
    expect(isRested(g, at(g, 'p1', 'characters', TASHIGI))).toBe(true);
    expect(hand(g)).toEqual([sai]);
  });

  it('an already active Tashigi is never forced to pay: nothing is spent unless the player accepts', () => {
    const g = mine(LD_LF.luffy, {
      characters: [TASHIGI],
      hand: [sai, mohji],
      costArea: { active: 3, rested: 0 },
    });
    endTurn(g);
    if (kind(g) === 'optional') no(g, 'p1');
    need(g, 'main', 'p2');
    expect(isRested(g, at(g, 'p1', 'characters', TASHIGI))).toBe(false);
    expect(hand(g)).toEqual([mohji, sai].sort());
    expect(charIdsOf(g, 'p1')).toEqual([TASHIGI]);
  });
});

void K;
