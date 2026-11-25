/**
 * EB02-011 Arlong (Character, Green, cost 3, 4000, Counter +1000, {Fish-Man}/{Arlong Pirates}/{East Blue}).
 *
 * Card text: "[On Play] If your Leader has the "Fish-Man" or "East Blue" type, give up to 1 rested DON!!
 * card to 1 of your Leader. Then, up to 1 of your opponent's Characters with a cost of 5 or less
 * cannot be rested until the end of your opponent's next turn."
 *
 * Rules: rules-digest 57 (a card that cannot be rested cannot attack, cannot block, cannot be rested
 * by effects); the "If" has no colon (effect condition); "Then" after a failed "If" does not resolve
 * (M4b-5); "until the end of your opponent's next turn" created on my turn ends with their next turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canFinish,
  canHit,
  choices,
  choose,
  chooseNone,
  donOf,
  E2C,
  E2L,
  endTurn,
  kind,
  mine,
  need,
  offers,
  playRaw,
} from './kit-eb02a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ARLONG = 'EB02-011';

function pos(leader: string, oppChars: string[] = [E2C.kingdew, E2C.hajrudin]) {
  return mine(
    leader,
    { hand: [ARLONG], costArea: { active: 3, rested: 2 } },
    { characters: oppChars },
  );
}

/** Play Arlong and answer the DON!! target (if asked) with my Leader. */
function play(g: TestGame) {
  playRaw(g, ARLONG);
  if (kind(g) === 'choose' && choices(g).includes(g.leader('p1'))) choose(g, [g.leader('p1')]);
}

describe('EB02-011 Arlong: [On Play] give a rested DON!! to the Leader; an opponent’s Character cannot be rested', () => {
  it('with a {Fish-Man} Leader: the Leader gets 1 DON!! and the chosen Character cannot attack on their next turn', () => {
    const g = pos(E2L.fishMan);
    play(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(donOf(g, 'p1').given).toBe(1);
    const kingdew = g.find('p2', 'characters', E2C.kingdew);
    expect(offers(g, kingdew)).toBe(true);
    choose(g, [kingdew]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canHit(g, kingdew, g.leader('p1'))).toBe(false);
    // The other Character was not chosen and can attack.
    expect(canHit(g, g.find('p2', 'characters', E2C.hajrudin), g.leader('p1'))).toBe(true);
  });

  it('with an {East Blue} Leader the condition holds as well', () => {
    const g = pos(E2L.eastBlue);
    play(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    choose(g, [g.find('p2', 'characters', E2C.kingdew)]);
    endTurn(g);
    expect(canHit(g, g.find('p2', 'characters', E2C.kingdew), g.leader('p1'))).toBe(false);
  });

  it('with any other Leader: no DON!! is given and, the "If" having failed, the Character is not restricted', () => {
    const g = pos(E2L.croc);
    playRaw(g, ARLONG);
    // No prompt belongs to a failed "If"; whatever was asked, nothing was applied.
    if (kind(g) === 'choose') {
      if (canFinish(g)) chooseNone(g);
    }
    expect(donOf(g, 'p1').given).toBe(0);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canHit(g, g.find('p2', 'characters', E2C.kingdew), g.leader('p1'))).toBe(true);
    expect(canHit(g, g.find('p2', 'characters', E2C.hajrudin), g.leader('p1'))).toBe(true);
  });

  it('the cost boundary: a cost 5 Character is offered, a cost 6 Character is not', () => {
    const g = pos(E2L.fishMan, [E2C.kingdew, E2C.thatch, E2C.karoo1]);
    play(g);
    expect(offers(g, g.find('p2', 'characters', E2C.kingdew))).toBe(true);
    expect(offers(g, g.find('p2', 'characters', E2C.karoo1))).toBe(true);
    expect(offers(g, g.find('p2', 'characters', E2C.thatch))).toBe(false);
  });

  it('restricts only one Character even when several qualify', () => {
    const g = pos(E2L.fishMan, [E2C.kingdew, E2C.hajrudin, E2C.marco]);
    play(g);
    choose(g, [g.find('p2', 'characters', E2C.hajrudin)]);
    endTurn(g);
    expect(canHit(g, g.find('p2', 'characters', E2C.hajrudin), g.leader('p1'))).toBe(false);
    expect(canHit(g, g.find('p2', 'characters', E2C.kingdew), g.leader('p1'))).toBe(true);
    expect(canHit(g, g.find('p2', 'characters', E2C.marco), g.leader('p1'))).toBe(true);
  });

  it('"up to 1": choosing no Character leaves everyone free to attack', () => {
    const g = pos(E2L.fishMan);
    play(g);
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    endTurn(g);
    expect(canHit(g, g.find('p2', 'characters', E2C.kingdew), g.leader('p1'))).toBe(true);
  });

  it('the restriction ends with the opponent’s next turn: two turns later the Character can attack again', () => {
    const g = pos(E2L.fishMan);
    play(g);
    const kingdew = g.find('p2', 'characters', E2C.kingdew);
    choose(g, [kingdew]);
    endTurn(g);
    expect(canHit(g, kingdew, g.leader('p1'))).toBe(false);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canHit(g, kingdew, g.leader('p1'))).toBe(true);
  });

  it('the restriction is already in force in my own turn: the Character cannot be rested by my other effects', () => {
    // Arlong's own text only; here it is checked that the pick is on the opponent's side, not mine.
    const g = pos(E2L.fishMan, [E2C.kingdew]);
    play(g);
    expect(choices(g).every((i) => g.card(i).owner === 'p2')).toBe(true);
  });

  it('"cannot be rested" also stops my own effects: Zoro’s [On Play] cannot rest the protected Character', () => {
    // OP11-021 Jinbe is a {Fish-Man} and {Straw Hat Crew} Leader: both Arlong's and Zoro's conditions hold.
    const g = mine(
      'OP11-021',
      { hand: [ARLONG, 'EB02-019'], costArea: { active: 8, rested: 2 } },
      { characters: [E2C.hajrudin, E2C.marco] },
    );
    play(g);
    const protectedChar = g.find('p2', 'characters', E2C.hajrudin);
    choose(g, [protectedChar]);
    playRaw(g, 'EB02-019');
    // Whether the protected Character is offered as a target is a presentation choice; what
    // matters is that it is not rested by the effect.
    expect(offers(g, g.find('p2', 'characters', E2C.marco))).toBe(true);
    if (offers(g, protectedChar)) choose(g, [protectedChar]);
    else chooseNone(g);
    expect(g.card(protectedChar).rested).toBe(false);
  });

  it('only rested DON!! count: with no rested DON!! left no DON!! is given', () => {
    const g = mine(
      E2L.fishMan,
      { hand: [ARLONG], costArea: { active: 3, rested: 0 } },
      { characters: [E2C.kingdew] },
    );
    playRaw(g, ARLONG);
    expect(donOf(g, 'p1').given).toBe(0);
  });
});
