/**
 * OP09-080 Thousand Sunny (Stage, Purple, cost 1, {Straw Hat Crew}).
 *
 * Card text: "[Opponent's Turn] You may rest this Stage: When your "Straw Hat Crew" type Character is
 * removed from the field by your opponent's effect, add up to 1 DON!! card from your DON!! deck and
 * rest it."
 *
 * Rules: "removed from the field" is any move off the field (K.O., return to hand, ...); a battle K.O.
 * is not an effect; the ability works only during the opponent's turn; "add up to N DON!!" asks a
 * count, most first.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  asksDonCount,
  atMain,
  attack,
  C9,
  chars,
  choose,
  don,
  donCountOptions,
  E9,
  hand,
  kind,
  L9,
  mine,
  need,
  no,
  offeredAbilities,
  opponentKOs,
  passBlock,
  playCard,
  takeDon,
  theirs,
  yes,
} from './kit-op09d.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP09-080';

/** p2's turn: p1 has the Stage and the given Characters; p2 holds Gum-Gum Lightning and 10 DON!!. */
function opp(o: { stageRested?: boolean } = {}) {
  return theirs(
    L9.neutral,
    {
      stage: { card: ID, rested: o.stageRested ?? false },
      characters: [C9.shc3, C9.c3],
      costArea: { active: 0, rested: 0 },
      donDeck: 10,
    },
    { hand: [E9.lightning], characters: [C9.c4], costArea: { active: 10, rested: 0 } },
  );
}

/** p2's Lightning K.O.s `card` of p1. Leaves whatever decision follows. */
function koWithLightning(g: TestGame, card: string) {
  opponentKOs(g, g.find('p1', 'characters', card));
}

describe("OP09-080 Thousand Sunny: [Opponent's Turn] rest this Stage: when my {Straw Hat Crew} Character is removed by the opponent's effect, add 1 DON!! rested", () => {
  it('printed effect: an opposing K.O. effect on my {Straw Hat Crew} Character offers the Stage; yes rests it and adds 1 rested DON!!', () => {
    const g = opp();
    koWithLightning(g, C9.shc3);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (asksDonCount(g)) takeDon(g, 1);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([C9.c3]);
    expect(don(g, 'p1')).toMatchObject({ deck: 9, rested: 1, active: 0 });
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
  });

  it('"add up to 1": the count is asked (1 or 0, most first); choosing 0 adds nothing though the Stage was rested', () => {
    const g = opp();
    koWithLightning(g, C9.shc3);
    yes(g, 'p1');
    expect(asksDonCount(g, 'p1')).toBe(true);
    expect(donCountOptions(g, 'p1')).toEqual(['1', '0']);
    takeDon(g, 0);
    expect(don(g, 'p1')).toMatchObject({ deck: 10, rested: 0, active: 0 });
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
  });

  it('declining the "you may": the Stage stays active and no DON!! is added', () => {
    const g = opp();
    koWithLightning(g, C9.shc3);
    no(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ deck: 10, rested: 0, active: 0 });
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
    expect(chars(g)).toEqual([C9.c3]);
  });

  it('a Character without the {Straw Hat Crew} type removed the same way: no prompt, no DON!!', () => {
    const g = opp();
    koWithLightning(g, C9.c3);
    expect(atMain(g, 'p2')).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ deck: 10, rested: 0 });
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
  });

  it("a battle K.O. is not an effect: my {Straw Hat Crew} Character K.O.'d in battle gives no prompt", () => {
    const g = theirs(
      L9.neutral,
      {
        stage: ID,
        characters: [{ card: C9.shc3, rested: true }],
        costArea: { active: 0, rested: 0 },
      },
      { characters: [C9.c4], costArea: { active: 10, rested: 0 } },
    );
    attack(g, g.find('p2', 'characters', C9.c4), g.find('p1', 'characters', C9.shc3));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(chars(g)).toEqual([]);
    expect(kind(g)).not.toBe('optional');
    expect(atMain(g, 'p2')).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ deck: 10, rested: 0 });
  });

  it('a rested Stage cannot pay "rest this Stage": no prompt', () => {
    const g = opp({ stageRested: true });
    koWithLightning(g, C9.shc3);
    expect(kind(g)).not.toBe('optional');
    expect(atMain(g, 'p2')).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ deck: 10, rested: 0 });
  });

  it("removal by 'return to the owner's hand' counts as removed from the field: the opposing Special Muggy Ball makes me return my Character", () => {
    const g = theirs(
      L9.neutral,
      { stage: ID, characters: [C9.shc3], costArea: { active: 0, rested: 0 } },
      { hand: ['OP09-058'], costArea: { active: 10, rested: 0 } },
    );
    playCard(g, 'OP09-058');
    // I choose the Character to return (a single candidate may be taken automatically).
    if (kind(g) === 'choose') {
      need(g, 'choose', 'p1');
      choose(g, [g.find('p1', 'characters', C9.shc3)]);
    }
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (asksDonCount(g)) takeDon(g, 1);
    expect(hand(g)).toEqual([C9.shc3]);
    expect(don(g, 'p1')).toMatchObject({ deck: 9, rested: 1 });
  });

  it('an empty DON!! deck: the Stage may be rested but there is nothing to add', () => {
    const g = theirs(
      L9.neutral,
      { stage: ID, characters: [C9.shc3], costArea: { active: 5, rested: 5 }, donDeck: 0 },
      { hand: [E9.lightning], costArea: { active: 10, rested: 0 } },
    );
    koWithLightning(g, C9.shc3);
    if (kind(g) === 'optional') yes(g, 'p1');
    if (asksDonCount(g)) takeDon(g, 0);
    expect(atMain(g, 'p2')).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ deck: 0, rested: 5, active: 5 });
  });

  it('it has no [Activate: Main]: nothing can be activated on it in my Main Phase', () => {
    const g = mine(L9.neutral, { stage: ID }, {});
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toEqual([]);
  });
});
