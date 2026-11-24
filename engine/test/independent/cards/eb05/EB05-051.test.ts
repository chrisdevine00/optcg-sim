/**
 * EB05-051 Ahiru (Character, Yellow, cost 3, 4000, Counter +1000, {Revolutionary Army}).
 *
 * Card text: "[On Play] Rest up to 1 of your opponent's Characters with a cost equal to or less than
 * the total of your and your opponent's Life cards.
 * [Trigger] Play this card."
 *
 * Rules: the limit is read when the effect resolves, from both players' Life (face-up or face-down);
 * CR 8-4-4-1 ("up to"); RL-25 / CR 10-1-5-3 (a [Trigger] card is in no area while it resolves, so it
 * is not one of the Life cards, and the damaged player's Life already shrank); the play of a
 * [Trigger] is free.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  BLUE,
  CH,
  chars,
  choiceCards,
  choose,
  chooseNone,
  declineTrigger,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  mine,
  playCard,
  RED,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-051';
const OPP = [CH.marco, CH.hajrudin, CH.kingdew]; // costs 3, 4, 5

function play(p1Life: number, p2Life: number, opp: string[] = OPP, faceUp = false) {
  const life = (n: number) => Array.from({ length: n }, () => ({ card: BLUE, faceUp }));
  const g = mine(
    LD.shc,
    { hand: [ID], life: life(p1Life), characters: [CH.sai] },
    { life: life(p2Life), characters: opp },
  );
  playCard(g, ID);
  return g;
}

describe('EB05-051 Ahiru [On Play]: rest up to 1 opposing Character with cost <= total Life of both players', () => {
  it('2 + 2 Life = 4: Marco (3) and Hajrudin (4) are candidates, Kingdew (5) is not', () => {
    const g = play(2, 2);
    expect(choiceCards(g)).toEqual([CH.marco, CH.hajrudin].sort());
  });

  it('the chosen Character is rested', () => {
    const g = play(2, 2);
    choose(g, [g.find('p2', 'characters', CH.hajrudin)]);
    expect(g.card(g.find('p2', 'characters', CH.hajrudin)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.marco)).rested).toBe(false);
  });

  it('boundary: one more Life card (3 + 2 = 5) makes the cost-5 Character a candidate', () => {
    const g = play(3, 2);
    expect(choiceCards(g)).toEqual([CH.marco, CH.hajrudin, CH.kingdew].sort());
  });

  it('the opponent’s Life counts too: 0 + 3 = 3 offers only the cost-3 Character', () => {
    const g = play(0, 3);
    expect(choiceCards(g)).toEqual([CH.marco]);
  });

  it('face-up Life cards count the same as face-down ones', () => {
    const g = play(2, 2, OPP, true);
    expect(choiceCards(g)).toEqual([CH.marco, CH.hajrudin].sort());
  });

  it('"up to 1": choosing nothing rests nothing', () => {
    const g = play(2, 2);
    chooseNone(g);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('only the opponent’s Characters are candidates (not my Sai)', () => {
    const g = play(2, 2);
    expect(choiceCards(g)).not.toContain(CH.sai);
  });

  it('with 0 Life on both sides only a cost-0 Character could be rested: nothing is offered for cost 3+', () => {
    const g = play(0, 0);
    expect(kind(g)).toBe('main');
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });
});

describe('EB05-051 Ahiru [Trigger]: play this card', () => {
  function hit(p1Life: number, p2Life: number) {
    const g = theirTurn(
      side(LD.shc, BLUE, { life: [ID, ...fill(BLUE, p1Life - 1)], characters: [CH.sai] }),
      side(LD.shc, RED, { life: fill(RED, p2Life), characters: OPP }),
    );
    hitLeader(g, g.leader('p2'));
    return g;
  }

  it('activating plays Ahiru for free and its [On Play] runs', () => {
    const g = hit(3, 2);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(chars(g)).toContain(ID);
    expect(kind(g)).toBe('choose');
  });

  it('the total is read after the damage: Ahiru is in no area, so p1 has 2 Life left + 2 = 4 (cost-5 not offered)', () => {
    const g = hit(3, 2);
    activateTrigger(g);
    // The effect is owed by p1 (the owner of Ahiru) even though it is p2's turn.
    expect(choiceCards(g)).toEqual([CH.marco, CH.hajrudin].sort());
  });

  it('declining the Trigger: Ahiru goes to hand and nothing is rested', () => {
    const g = hit(3, 2);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
    expect(trash(g)).toEqual([]);
  });
});
