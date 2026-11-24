/**
 * OP14-098 Crescent Cutlass (Event, Black, cost 1, {Impel Down}/{Former Baroque Works}).
 *
 * Card text: "[Main] If there is a Character with a cost of 0 or with a cost of 8 or more, all of your
 * Characters with a type including "Baroque Works" gain +3 cost until the end of your opponent's
 * next End Phase.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 10-2-3 ([Main]), CR 10-2-4 ([Counter]), CR 6-6-1 (durations), M4b-7 ("a Character" is on
 * either side, current cost). "All of your Characters" is fixed when the effect resolves.
 * Cost 0 is made with OP17-097 (every opposing Character -1 cost this turn): a cost-1 Mohji.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  BW,
  canCounterNow,
  chars,
  chooseIfAsked,
  don,
  kind,
  LD14,
  makeCostZero,
  mine,
  passBlock,
  playId,
  SC14,
  theirs,
  trash,
  useCounter,
  BLUE,
} from './kit-op14d.ts';

const ID = 'OP14-098';

function main(o: { mine?: string[]; theirs?: string[]; hand?: string[] } = {}) {
  return mine(
    LD14.bw,
    { hand: [ID, ...(o.hand ?? [])], characters: o.mine ?? [BW.mr9, BW.croc6, SC14.c2] },
    { characters: o.theirs ?? [SC14.c8, BW.daz] },
  );
}

function costOf(g: ReturnType<typeof main>, who: 'p1' | 'p2', card: string): number | null {
  return g.card(g.find(who, 'characters', card)).cost;
}

describe('OP14-098 Crescent Cutlass: [Main] +3 cost for my Baroque Works Characters, if a Character has cost 0 or 8+', () => {
  it('an opposing cost-8 Character: my {Baroque Works} Characters get +3 cost (5 -> 8, 6 -> 9)', () => {
    const g = main();
    playId(g, ID);
    expect(atMain(g)).toBe(true);
    expect(costOf(g, 'p1', BW.mr9)).toBe(8);
    expect(costOf(g, 'p1', BW.croc6)).toBe(9);
    expect(trash(g)).toEqual([ID]);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('only Characters whose type includes "Baroque Works": a plain Character and an opposing Baroque Works Character are unchanged', () => {
    const g = main({ theirs: [SC14.c8, BW.mr9] });
    playId(g, ID);
    expect(costOf(g, 'p1', SC14.c2)).toBe(2);
    expect(costOf(g, 'p2', BW.mr9)).toBe(5);
    expect(costOf(g, 'p2', SC14.c8)).toBe(8);
  });

  it('"type including": a {Former Baroque Works} Character gets the bonus', () => {
    const g = main({ mine: [BW.daz] });
    playId(g, ID);
    expect(costOf(g, 'p1', BW.daz)).toBe(8);
  });

  it('condition boundary: with only cost-7 Characters on the field nothing changes', () => {
    const g = main({ theirs: [SC14.c7], mine: [BW.mr9] });
    playId(g, ID);
    expect(costOf(g, 'p1', BW.mr9)).toBe(5);
  });

  it('the condition counts my own Characters too: my own cost-8 Character is enough', () => {
    const g = main({ mine: [BW.croc8, BW.mr9], theirs: [SC14.c2] });
    playId(g, ID);
    expect(costOf(g, 'p1', BW.mr9)).toBe(8);
    expect(costOf(g, 'p1', BW.croc8)).toBe(11);
  });

  it('a Character of cost 0 satisfies the condition', () => {
    const g = main({ hand: [SC14.shrink], theirs: [SC14.c1], mine: [BW.mr9] });
    makeCostZero(g, g.find('p2', 'characters', SC14.c1));
    playId(g, ID);
    expect(costOf(g, 'p1', BW.mr9)).toBe(8);
    expect(costOf(g, 'p2', SC14.c1)).toBe(0);
  });

  it("lasts until the end of the opponent's next End Phase: still there in their turn, gone in my next turn", () => {
    const g = main({ mine: [BW.mr9] });
    playId(g, ID);
    g.act({ type: 'endTurn' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(costOf(g, 'p1', BW.mr9)).toBe(8);
    g.act({ type: 'endTurn' });
    expect(atMain(g)).toBe(true);
    expect(costOf(g, 'p1', BW.mr9)).toBe(5);
  });

  it('"all of your Characters" is fixed at resolution: a Baroque Works Character played afterwards has its normal cost', () => {
    const g = main({ mine: [], hand: [BW.mr9] });
    playId(g, ID);
    playId(g, BW.mr9);
    expect(costOf(g, 'p1', BW.mr9)).toBe(5);
  });

  it('the [Main] effect gives no power', () => {
    const g = main();
    playId(g, ID);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(BLUE).toBeTruthy();
  });
});

describe('OP14-098 Crescent Cutlass: [Counter] my Leader gains +3000 power during this battle', () => {
  function defend(attacker: string) {
    const g = theirs(
      LD14.bw,
      {
        hand: [ID, BLUE],
        characters: [BW.mr9],
        life: [BLUE, BLUE, BLUE, BLUE],
        costArea: { active: 2, rested: 0 },
      },
      { characters: [attacker] },
    );
    attack(g, g.find('p2', 'characters', attacker), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('+3000 makes my Leader 8000: a 7000 attack fails', () => {
    const g = defend(SC14.c5);
    expect(kind(g)).toBe('counter');
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: against an 8000 attack the 8000 Leader still loses the tie', () => {
    const g = defend(SC14.c6);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
  });

  it('the Counter does not touch costs (no [Main] effect) and the boost ends with the battle', () => {
    const g = defend(SC14.c5);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.card(at(g, 'p1', 'characters', BW.mr9)).cost).toBe(5);
    g.act({ type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('costs 1 DON!!: with no active DON!! it cannot be used as a Counter', () => {
    const g = theirs(
      LD14.bw,
      { hand: [ID], life: [BLUE, BLUE, BLUE, BLUE], costArea: { active: 0, rested: 2 } },
      { characters: [SC14.c5] },
    );
    attack(g, g.find('p2', 'characters', SC14.c5), g.leader('p1'));
    passBlock(g);
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
    expect(chars(g)).toEqual([]);
  });
});
