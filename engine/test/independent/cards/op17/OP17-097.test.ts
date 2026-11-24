/**
 * OP17-097 I'll Feed on This Rage and Use It to Bring the World to Ruin!!! (Event, Black, cost 1, {Giant}/{Elbaph}).
 *
 * Card text: "[Main] Give all of your opponent's Characters −1 cost during this turn. [Counter] Your
 * Leader gains +3000 power during this battle."
 *
 * Rules: CR 1-3-6-2 (a cost may go negative inside a calculation and reads as 0 outside it), CR
 * 6-6-1-3 ("during this turn"), RL-08 ("during this battle"), CR 7-1-3-1-2 (Event [Counter]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  at,
  atMain,
  attack,
  kind,
  LD,
  mine,
  need,
  passBlock,
  passCounter,
  playCard,
  SCN,
  theirs,
  trash,
  don,
  hand,
} from './kit-op17b.ts';

const EVENT = 'OP17-097';

function main(
  opp: (string | { card: string; rested?: boolean })[],
  mineChars: string[] = [],
  copies = 1,
) {
  return mine(
    LD.elbaph,
    { hand: Array.from({ length: copies }, () => EVENT), characters: mineChars },
    { characters: opp },
  );
}

describe("OP17-097 I'll Feed on This Rage... [Main] all opposing Characters -1 cost this turn", () => {
  it('every opposing Character gets -1 cost (3 -> 2, 1 -> 0)', () => {
    const g = main([SCN.c3, SCN.c1, SCN.c8]);
    playCard(g, EVENT);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).cost).toBe(2);
    expect(g.card(at(g, 'p2', 'characters', SCN.c1)).cost).toBe(0);
    expect(g.card(at(g, 'p2', 'characters', SCN.c8)).cost).toBe(7);
  });

  it('"all" includes rested Characters', () => {
    const g = main([{ card: SCN.c4, rested: true }, SCN.c5]);
    playCard(g, EVENT);
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).cost).toBe(3);
    expect(g.card(at(g, 'p2', 'characters', SCN.c5)).cost).toBe(4);
  });

  it('my own Characters are unaffected', () => {
    const g = main([SCN.c3], [SCN.c4]);
    playCard(g, EVENT);
    expect(g.card(at(g, 'p1', 'characters', SCN.c4)).cost).toBe(4);
  });

  it('asks nothing: no target prompt, no optional, back to the Main Phase; the Event is trashed', () => {
    const g = main([SCN.c3, SCN.c4]);
    playCard(g, EVENT);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([EVENT]);
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('with no opposing Characters it just resolves', () => {
    const g = main([]);
    playCard(g, EVENT);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([EVENT]);
  });

  it("lasts this turn only: during the opponent's turn the cost is back to normal", () => {
    const g = main([SCN.c3]);
    playCard(g, EVENT);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).cost).toBe(2);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).cost).toBe(3);
  });

  it('a cost never reads below 0: a cost-1 Character after two plays still reads 0', () => {
    const g = main([SCN.c1, SCN.c2], [], 2);
    playCard(g, EVENT);
    expect(g.card(at(g, 'p2', 'characters', SCN.c1)).cost).toBe(0);
    playCard(g, EVENT);
    expect(g.card(at(g, 'p2', 'characters', SCN.c1)).cost).toBe(0);
    expect(g.card(at(g, 'p2', 'characters', SCN.c2)).cost).toBe(0);
  });

  it('the reduction is a cost change only: powers are untouched', () => {
    const g = main([SCN.c4]);
    playCard(g, EVENT);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });
});

describe("OP17-097 I'll Feed on This Rage... [Counter] my Leader +3000 during this battle", () => {
  function counterStep(chars: string[] = []) {
    const g = theirs(
      LD.elbaph,
      { hand: [EVENT], characters: chars, costArea: { active: 1, rested: 0 } },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('gives my Leader +3000 for the battle (no target prompt) and the attack no longer connects', () => {
    const g = counterStep();
    activateCounter(g, g.find('p1', 'hand', EVENT));
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boosts the Leader only, not my Characters', () => {
    const g = counterStep([SCN.c3]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(5000);
  });
});
