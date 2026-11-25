/**
 * OP11-024 Aladine (Character, Green, cost 4, 5000, Counter +1000, {The Sun Pirates}/{Merfolk}/
 * {Fish-Man Island}).
 *
 * Card text: "When this Character is K.O.'d by your opponent's effect, you may trash 1 card from your
 * hand and rest 1 of your DON!! cards. If you do, play up to 1 "Fish-Man" or "Merfolk" type
 * Character card with a cost of 6 or less from your hand."
 *
 * Rules: the trigger needs a K.O. caused by the OPPONENT's effect (RL-14), not a battle K.O. The
 * two costs are paid together ("and"): both must be payable, otherwise the effect is not used (CR
 * 8-3-1-3). Only an ACTIVE DON!! can be rested. "If you do" gates the play on both costs being paid.
 * The card is played active from the hand. "Up to 1" may be none.
 */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../../../src/testing.ts';
import {
  at,
  attack,
  chr,
  donOf,
  hand,
  ids,
  KC,
  kind,
  L11,
  mine,
  N11,
  need,
  no,
  none,
  offeredIds,
  opponentKingdomCome,
  passBlock,
  passCounter,
  payCosts,
  pickInst,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op11a.ts';

const ALADINE = 'OP11-024';
const FODDER = N11.marco;

function game(handCards: string[], active = 3) {
  return theirs(
    L11.luffy,
    { characters: [ALADINE], hand: handCards, costArea: { active, rested: 0 } },
    { hand: [KC] },
  );
}

/** p2's Kingdom Come K.O.s Aladine; leaves the engine at the first prompt of the replacement-free [K.O.] effect. */
function koed(handCards: string[], active = 3) {
  const g = game(handCards, active);
  opponentKingdomCome(g, chr(g, 'p1', ALADINE));
  return g;
}

describe('OP11-024 Aladine: when K.O.’d by the opponent’s effect, trash 1 and rest 1 DON!!: play a Fish-Man/Merfolk', () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = game([]);
    const a = chr(g, 'p1', ALADINE);
    expect(g.card(a).cost).toBe(4);
    expect(g.power(a)).toBe(5000);
    expect(g.card(a).counter).toBe(1000);
  });

  it('pays both costs and plays the chosen Fish-Man Character from hand, active', () => {
    const g = koed([N11.fish6, FODDER]);
    need(g, 'optional', 'p1');
    yes(g);
    payCosts(g, [at(g, 'p1', 'hand', FODDER)]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', N11.fish6)]);
    expect(ids(g, 'p1', 'characters')).toEqual([N11.fish6]);
    expect(g.card(chr(g, 'p1', N11.fish6)).rested).toBe(false);
    expect(trash(g)).toContain(FODDER);
    expect(trash(g)).toContain(ALADINE);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('boundary: cost 6 can be played (above), cost 7 cannot; Merfolk qualifies, other types do not', () => {
    const g = koed([N11.fish6, N11.fish7, N11.merfolk3, N11.navy3, FODDER]);
    yes(g);
    payCosts(g, [at(g, 'p1', 'hand', FODDER)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.fish6, N11.merfolk3].sort());
  });

  it('may be declined: nothing is trashed, no DON!! is rested, nothing is played', () => {
    const g = koed([N11.fish6, FODDER]);
    need(g, 'optional', 'p1');
    no(g);
    expect(hand(g)).toEqual([N11.fish6, FODDER].sort());
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('with no active DON!! the costs cannot be paid: nothing is played', () => {
    const g = koed([N11.fish3, FODDER], 0);
    unusable(g, 'p1');
    expect(hand(g)).toEqual([N11.fish3, FODDER].sort());
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('with an empty hand the trash cost cannot be paid: nothing is played', () => {
    const g = koed([]);
    unusable(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('the trashed card is chosen from the hand and may be the only Fish-Man: then nothing is left to play', () => {
    const g = koed([N11.fish3]);
    need(g, 'optional', 'p1');
    yes(g);
    payCosts(g, [at(g, 'p1', 'hand', N11.fish3)]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(trash(g)).toContain(N11.fish3);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('"up to 1": may play nothing after paying', () => {
    const g = koed([N11.fish3, FODDER]);
    yes(g);
    payCosts(g, [at(g, 'p1', 'hand', FODDER)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([N11.fish3]);
  });

  it('a battle K.O. does not trigger it', () => {
    const g = theirs(
      L11.luffy,
      {
        characters: [{ card: ALADINE, rested: true }],
        hand: [N11.fish3, FODDER],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [N11.thatch] },
    );
    attack(g, chr(g, 'p2', N11.thatch), chr(g, 'p1', ALADINE));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).not.toBe('optional');
    expect(hand(g)).toEqual([N11.fish3, FODDER].sort());
    expect(trash(g)).toEqual([ALADINE]);
  });

  it('an own-effect K.O. does not trigger it (the cause must be the opponent’s effect)', () => {
    const g = mine(
      L11.luffy,
      { characters: [ALADINE], hand: [N11.fish6, FODDER], costArea: { active: 3, rested: 0 } },
      {},
    );
    const target = chr(g, 'p1', ALADINE);
    g.state = applyOp(g.state, { op: 'ko', card: target, by: 'p1' }).state;
    expect(kind(g)).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'hand')).toEqual([N11.fish6, FODDER].sort());
  });
});
