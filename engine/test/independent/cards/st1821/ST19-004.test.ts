/**
 * ST19-004 Hina (Black Character, cost 4, 6000, no Counter, {Navy}).
 * "[DON!! x1] [Opponent's Turn] This Character gains +4 cost.
 * [Activate: Main] [Once Per Turn] You may place 1 card from your trash at the bottom of your deck:
 * Give up to 1 rested DON!! card to your Leader or 1 of your Characters."
 * Rules: [DON!! x1] needs at least 1 DON!! given to this card; the cost bonus is not cumulative with
 * more DON!!; the bonus applies on the opponent's turn only. A rested DON!! given to a card is
 * moved from the cost area.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  BLUE,
  cost,
  deck,
  donOf,
  inst,
  LD,
  mainFor,
  many,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payHand,
  pickInst,
  SC,
  tail,
  theirs,
  trash,
  useAbility,
} from './kit-st1821a.ts';

const ID = 'ST19-004';

describe("ST19-004 Hina: [DON!! x1][Opponent's Turn] +4 cost", () => {
  it('with 1 DON!! given, on the opponent turn its cost is 8', () => {
    const g = theirs(LD.navy, { characters: [{ card: ID, don: 1 }] });
    expect(g.card(inst(g, 'p1', 'characters', ID)).cost).toBe(8);
  });

  it('on my own turn the bonus does not apply: cost 4', () => {
    const g = mine(LD.navy, { characters: [{ card: ID, don: 1 }], ...cost(5) });
    expect(g.card(inst(g, 'p1', 'characters', ID)).cost).toBe(4);
  });

  it('with no DON!! given the bonus does not apply even on the opponent turn', () => {
    const g = theirs(LD.navy, { characters: [ID] });
    expect(g.card(inst(g, 'p1', 'characters', ID)).cost).toBe(4);
  });

  it('with 2 DON!! given the bonus is still +4, not +8', () => {
    const g = theirs(LD.navy, { characters: [{ card: ID, don: 2 }] });
    expect(g.card(inst(g, 'p1', 'characters', ID)).cost).toBe(8);
  });
});

describe('ST19-004 Hina: [Activate: Main] [Once Per Turn] trash to deck bottom: give up to 1 rested DON!!', () => {
  function start(trashCards: string[] = [SC.c2, SC.c3], rested = 3) {
    return mine(LD.navy, {
      characters: [ID, SC.c3],
      trash: trashCards,
      deck: many(BLUE, 10),
      costArea: { active: 4, rested },
    });
  }

  it('paying places the picked trash card at the bottom of my deck and gives 1 rested DON!! to the chosen card', () => {
    const g = start();
    const hina = inst(g, 'p1', 'characters', ID);
    useAbility(g, hina);
    payHand(g, [SC.c2]);
    need(g, 'choose', 'p1');
    pickInst(g, [hina]);
    mainFor(g);
    expect(trash(g)).toEqual([SC.c3]);
    expect(tail(deck(g), 1)).toEqual([SC.c2]);
    expect(deck(g)).toHaveLength(11);
    expect(g.card(hina).don).toBe(1);
    expect(donOf(g, 'p1').rested).toBe(2);
    expect(donOf(g, 'p1').given).toBe(1);
  });

  it('the DON!! can go to my Leader or to any of my Characters, and only mine', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payHand(g, [SC.c2]);
    need(g, 'choose', 'p1');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []))
      .sort();
    const mineIds = [g.leader('p1'), ...g.zone('p1', 'characters').map((c) => c.instance)].sort();
    expect(offered).toEqual(mineIds);
  });

  it('giving to the Leader works', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payHand(g, [SC.c2]);
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('"up to 1": choosing nobody gives no DON!! (the trash card was still paid)', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payHand(g, [SC.c2]);
    none(g);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(trash(g)).toEqual([SC.c3]);
  });

  it('only a rested DON!! is given: with none rested nothing is given', () => {
    const g = start([SC.c2, SC.c3], 0);
    const hina = inst(g, 'p1', 'characters', ID);
    useAbility(g, hina);
    payHand(g, [SC.c2]);
    if (g.legal().some((a) => a.type === 'done')) act(g, { type: 'done' });
    mainFor(g);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(donOf(g, 'p1').active).toBe(4);
    expect(trash(g)).toEqual([SC.c3]);
  });

  it('activating is choosing to pay: the cost card must then be picked (no yes/no question, no skipping)', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('the trash card choice offers my trash cards', () => {
    const g = start([SC.c2, SC.c3]);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c2, SC.c3].sort());
  });

  it('with an empty trash the cost cannot be paid: the ability is not offered or cannot be accepted', () => {
    const g = start([]);
    const hina = inst(g, 'p1', 'characters', ID);
    expect(offeredAbilities(g, hina)).toEqual([]);
    expect(donOf(g, 'p1').given).toBe(0);
  });

  it('Once Per Turn: a second activation in the same turn is not offered', () => {
    const g = start();
    const hina = inst(g, 'p1', 'characters', ID);
    useAbility(g, hina);
    payHand(g, [SC.c2]);
    pickInst(g, [hina]);
    mainFor(g);
    expect(offeredAbilities(g, hina)).toEqual([]);
  });
});
