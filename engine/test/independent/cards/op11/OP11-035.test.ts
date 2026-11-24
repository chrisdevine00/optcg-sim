/**
 * OP11-035 Fisher Tiger (Character, Green, cost 6, 7000, Counter +1000, {Fish-Man}/{The Sun
 * Pirates}/{Fish-Man Island}).
 *
 * Card text: "When this Character is K.O.'d by your opponent's effect, you may rest 1 of your DON!!
 * cards. If you do, play up to 1 "Fish-Man" or "Merfolk" type Character card with a cost of 4 or
 * less from your hand.
 * [On Play] Rest up to 1 of your opponent's Characters."
 *
 * Rules: the K.O. trigger needs a K.O. by the OPPONENT's effect (RL-14), not a battle K.O. Only an
 * ACTIVE DON!! can be rested; "If you do" gates the play on paying it. The card played comes
 * active from the hand. "Up to 1" may be none. Resting a Character that is already rested changes
 * nothing.
 */
import { describe, expect, it } from 'vitest';
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
  playRaw,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op11a.ts';

const TIGER = 'OP11-035';

describe('OP11-035 Fisher Tiger: [On Play] rest up to 1 opposing Character', () => {
  it('printed values: cost 6, 7000, Counter +1000', () => {
    const g = mine(L11.luffy, { hand: [TIGER] });
    const t = at(g, 'p1', 'hand', TIGER);
    expect(g.card(t).cost).toBe(6);
    expect(g.power(t)).toBe(7000);
    expect(g.card(t).counter).toBe(1000);
  });

  it('rests the chosen opposing Character', () => {
    const g = mine(L11.luffy, { hand: [TIGER] }, { characters: [N11.marco, N11.sai] });
    playRaw(g, TIGER);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    expect(g.card(chr(g, 'p2', N11.marco)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', N11.sai)).rested).toBe(false);
  });

  it('never offers my own Characters', () => {
    const g = mine(
      L11.luffy,
      { hand: [TIGER], characters: [N11.navy3] },
      { characters: [N11.marco] },
    );
    playRaw(g, TIGER);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.marco]);
  });

  it('"up to 1": may rest no one', () => {
    const g = mine(L11.luffy, { hand: [TIGER] }, { characters: [N11.marco] });
    playRaw(g, TIGER);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(chr(g, 'p2', N11.marco)).rested).toBe(false);
  });
});

describe('OP11-035 Fisher Tiger: when K.O.’d by the opponent’s effect, rest 1 DON!!: play a Fish-Man/Merfolk of cost 4 or less', () => {
  function game(handCards: string[], active = 3) {
    return theirs(
      L11.luffy,
      { characters: [TIGER], hand: handCards, costArea: { active, rested: 0 } },
      { hand: [KC] },
    );
  }
  function koed(handCards: string[], active = 3) {
    const g = game(handCards, active);
    opponentKingdomCome(g, chr(g, 'p1', TIGER));
    return g;
  }

  it('rests 1 DON!! and plays the chosen Fish-Man Character from hand, active', () => {
    const g = koed([N11.fish4, N11.marco]);
    need(g, 'optional', 'p1');
    yes(g);
    payCosts(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', N11.fish4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([N11.fish4]);
    expect(g.card(chr(g, 'p1', N11.fish4)).rested).toBe(false);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    expect(hand(g)).toEqual([N11.marco]);
  });

  it('boundary: cost 4 is offered, cost 5 is not; Merfolk qualifies, other types do not', () => {
    const g = koed([N11.fish4, N11.fish5, N11.merfolk3, N11.navy3]);
    yes(g);
    payCosts(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.fish4, N11.merfolk3].sort());
  });

  it('may be declined: DON!! stay active and nothing is played', () => {
    const g = koed([N11.fish4]);
    need(g, 'optional', 'p1');
    no(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([N11.fish4]);
  });

  it('with no active DON!! the cost cannot be paid: nothing is played', () => {
    const g = koed([N11.fish4], 0);
    unusable(g, 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([N11.fish4]);
  });

  it('"up to 1": may play nothing after resting the DON!!', () => {
    const g = koed([N11.fish4]);
    yes(g);
    payCosts(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(donOf(g, 'p1').rested).toBe(1);
  });

  it('a battle K.O. does not trigger it', () => {
    const g = theirs(
      L11.luffy,
      {
        characters: [{ card: TIGER, rested: true }],
        hand: [N11.fish4],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [N11.thatch, N11.oars] },
    );
    attack(g, chr(g, 'p2', N11.oars), chr(g, 'p1', TIGER));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([TIGER]);
    expect(hand(g)).toEqual([N11.fish4]);
  });
});
