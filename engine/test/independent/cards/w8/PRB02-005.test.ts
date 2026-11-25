/**
 * PRB02-005 Monkey.D.Luffy (Character, Green, cost 4, 5000, Counter +1000, {Straw Hat Crew}/
 * {Supernovas}).
 *
 * Card text: "[Your Turn] [On Play] If your Leader is multicolored and your opponent has 7 or less DON!!
 * cards on their field, your opponent rests 1 of their active DON!! cards at the start of their next
 * Main Phase."
 *
 * Rules used: the conditions are read when the [On Play] resolves, not at the start of the Main Phase
 * (official PRB02 Q&A: an opponent who then has 8 or more DON!! still rests 1; M6b-Q91); "DON!!
 * cards on their field" counts the cost area and DON!! given to cards (CR 6-5-5-1); the opponent
 * makes the choice of which active DON!! (all of them are in one state, so the prompt may or may not
 * be asked: both are accepted); the refresh and DON!! phases come first, so every DON!! is active when
 * the Main Phase starts.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  asksDon,
  C8,
  decision,
  donCounts,
  endTurn,
  kind,
  L8,
  mine8,
  need,
  pickDonClass,
  sortedCards,
} from './kit-w8a.ts';

const LUFFY = 'PRB02-005';

/** p1 plays Luffy (cost 4 from 10 active DON!!) with a Leader `leader` against an opponent with `p2` DON!!. */
function played(leader: string, p2: { active: number; rested: number }, p2Extra = {}) {
  const g = mine8(leader, { hand: [LUFFY] }, { costArea: p2, ...p2Extra });
  act(g, { type: 'playCard', card: g.find('p1', 'hand', LUFFY) });
  return g;
}

/** End p1's turn. If the opponent is asked which active DON!! to rest, answer it (one class only). Returns whether it was asked. */
function toOpponentMain(g: ReturnType<typeof mine8>): boolean {
  endTurn(g);
  let asked = false;
  if (asksDon(g, 'p2')) {
    asked = true;
    pickDonClass(g, 'costActive');
  }
  need(g, 'main', 'p2');
  return asked;
}

describe("PRB02-005 Monkey.D.Luffy: [Your Turn] [On Play] rest 1 of the opponent's active DON!! at the start of their next Main Phase", () => {
  it('printed values: Character, cost 4, 5000 power, Counter +1000', () => {
    const g = mine8(L8.law, { hand: [LUFFY] });
    const l = g.card(g.find('p1', 'hand', LUFFY));
    expect(l.cost).toBe(4);
    expect(l.counter).toBe(1000);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', LUFFY) });
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(5000);
  });

  it("nothing happens during the turn it is played: the opponent's DON!! are untouched and nothing is asked", () => {
    const g = played(L8.law, { active: 5, rested: 2 });
    need(g, 'main', 'p1');
    expect(donCounts(g, 'p2')).toMatchObject({ active: 5, rested: 2 });
  });

  it('multicoloured Leader, opponent with 7 DON!!: at the start of their next Main Phase 1 active DON!! is rested (after refresh and DON!! phase: 9 DON!!, 8 active, 1 rested)', () => {
    const g = played(L8.law, { active: 4, rested: 3 });
    toOpponentMain(g);
    expect(donCounts(g, 'p2')).toMatchObject({ active: 8, rested: 1 });
  });

  it('the opponent owes the choice of the DON!!, and only one is rested (not two)', () => {
    const g = played(L8.law, { active: 7, rested: 0 });
    endTurn(g);
    const d = decision(g)!;
    // Either the one-answer DON!! pick is asked of the opponent, or the DON!! is rested without a question.
    if (d.kind === 'choose') {
      expect(d.player).toBe('p2');
      expect(d.min).toBe(1);
      expect(d.max).toBe(1);
      pickDonClass(g, 'costActive');
    }
    need(g, 'main', 'p2');
    expect(donCounts(g, 'p2')).toMatchObject({ active: 8, rested: 1 });
  });

  it('boundary: exactly 7 DON!! on their field is enough; 8 is not (and 6 is)', () => {
    const six = played(L8.law, { active: 6, rested: 0 });
    toOpponentMain(six);
    expect(donCounts(six, 'p2')).toMatchObject({ active: 7, rested: 1 });
    const seven = played(L8.law, { active: 7, rested: 0 });
    toOpponentMain(seven);
    expect(donCounts(seven, 'p2')).toMatchObject({ active: 8, rested: 1 });
    const eight = played(L8.law, { active: 8, rested: 0 });
    const asked = toOpponentMain(eight);
    expect(asked).toBe(false);
    expect(donCounts(eight, 'p2')).toMatchObject({ active: 10, rested: 0 });
  });

  it('rested DON!! count on their field too: 3 active + 5 rested = 8 is not "7 or less"', () => {
    const g = played(L8.law, { active: 3, rested: 5 });
    const asked = toOpponentMain(g);
    expect(asked).toBe(false);
    expect(donCounts(g, 'p2')).toMatchObject({ active: 10, rested: 0 });
  });

  it('DON!! given to their cards count: 5 in the cost area + 2 given = 7 is enough; 6 + 2 = 8 is not', () => {
    const seven = played(
      L8.law,
      { active: 5, rested: 0 },
      { characters: [{ card: C8.sai, don: 2 }], donDeck: 3 },
    );
    toOpponentMain(seven);
    // Refresh returns the given DON!! to the cost area: 7 + 2 from the DON!! phase = 9; 1 rested.
    expect(donCounts(seven, 'p2')).toMatchObject({ rested: 1 });
    const eight = played(
      L8.law,
      { active: 6, rested: 0 },
      { characters: [{ card: C8.sai, don: 2 }], donDeck: 2 },
    );
    const asked = toOpponentMain(eight);
    expect(asked).toBe(false);
    expect(donCounts(eight, 'p2').rested).toBe(0);
  });

  it('the conditions are read when it is played, not at the start of their Main Phase: 7 DON!! then, 9 by the time of their Main Phase, still rests 1 (official Q&A)', () => {
    const g = played(L8.law, { active: 7, rested: 0 });
    endTurn(g);
    if (asksDon(g, 'p2')) pickDonClass(g, 'costActive');
    need(g, 'main', 'p2');
    const d = donCounts(g, 'p2');
    expect(d.active + d.rested).toBe(9);
    expect(d.rested).toBe(1);
  });

  it('a Leader that is not multicoloured: no DON!! is rested and nothing is asked', () => {
    const g = played(L8.luffy, { active: 4, rested: 0 });
    const asked = toOpponentMain(g);
    expect(asked).toBe(false);
    expect(donCounts(g, 'p2')).toMatchObject({ active: 6, rested: 0 });
  });

  it('a second multicoloured Leader (Blue/Purple Sanji) works the same', () => {
    const g = played(L8.sanji, { active: 2, rested: 0 });
    toOpponentMain(g);
    expect(donCounts(g, 'p2')).toMatchObject({ active: 3, rested: 1 });
  });

  it('only the next Main Phase: the following opponent turn rests nothing more', () => {
    const g = played(L8.law, { active: 4, rested: 0 });
    toOpponentMain(g);
    endTurn(g); // p2 ends
    need(g, 'main', 'p1');
    endTurn(g); // p1 ends
    const asked = asksDon(g, 'p2');
    expect(asked).toBe(false);
    need(g, 'main', 'p2');
    // Refresh made everything active again and the DON!! phase added 2 more: no DON!! is rested.
    expect(donCounts(g, 'p2').rested).toBe(0);
  });

  it("two Luffys played in one turn each leave their own delayed effect: 2 of the opponent's active DON!! are rested", () => {
    const g = mine8(L8.law, { hand: [LUFFY, LUFFY] }, { costArea: { active: 3, rested: 0 } });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', LUFFY) });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', LUFFY) });
    endTurn(g);
    // Two identical delayed effects: the engine may ask for their order and the DON!! picks.
    for (let i = 0; i < 8 && kind(g) !== 'main'; i++) {
      if (kind(g) === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
      else pickDonClass(g, 'costActive');
    }
    need(g, 'main', 'p2');
    expect(donCounts(g, 'p2')).toMatchObject({ active: 3, rested: 2 }); // 3 + 2 DON!! phase, 2 rested
  });

  it("it is the opponent's DON!! that is rested, never the player's own", () => {
    const g = played(L8.law, { active: 3, rested: 0 });
    const before = donCounts(g, 'p1');
    toOpponentMain(g);
    const after = donCounts(g, 'p1');
    // p1 refreshes nothing on p2's turn: its DON!! are as they were at the end of its turn.
    expect(after).toMatchObject({ active: before.active, rested: before.rested });
    expect(sortedCards(g, 'p1', 'characters')).toEqual([LUFFY]);
    expect(kind(g)).toBe('main');
  });
});
