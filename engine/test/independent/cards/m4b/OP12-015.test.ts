/**
 * OP12-015 Monkey.D.Luffy (Character, Red, cost 4, 4000, Counter +1000; Straw Hat Crew / Supernovas).
 *
 * Card text (cards/data):
 *   "If you have a total of 2 or more given DON!! cards, this Character gains +2000 power.
 *    [On Play] You may reveal 2 Events from your hand: Play up to 1 red Character card with 3000
 *    power or less from your hand. Then, give up to 1 rested DON!! card to your Leader or 1 of your
 *    Characters."
 *
 * Rules: the first sentence is a permanent state check over all DON!! given to your Leader and
 * Characters, on either turn (CR 8-1-3-3, 8-3-2-3, RL-13), and is separate from the +1000 each given
 * DON!! adds on your own turn (CR 6-5-5-2). Revealing leaves the cards in the hand (CR 8-3-1; the
 * cost is "reveal", not "trash"). The play is free (no cost paid) and enters active. "Then" does not
 * depend on the play having happened (CR 4-10-2). Only a rested DON!! can be given.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import {
  accept,
  act,
  CH,
  choiceCards,
  choices,
  choose,
  decline,
  donOf,
  drive,
  EV,
  F,
  kind,
  LB,
  myTurn,
  offered,
  play,
  side,
  sideL,
  sortedIds,
  theirTurn,
} from './kit-b.ts';

const LUFFY = 'OP12-015';

describe('OP12-015 Luffy: +2000 power while you have a total of 2 or more given DON!!', () => {
  function field(leaderDon: number, otherDon: number, luffyDon = 0) {
    return myTurn(
      sideL({ card: LB.redShc, don: leaderDon }, F.red, {
        characters: [
          { card: LUFFY, don: luffyDon },
          { card: CH.robin, don: otherDon },
        ],
      }),
      side(LB.opp, F.red),
    );
  }

  it('0 given DON!!: 4000', () => {
    const g = field(0, 0);
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(4000);
  });

  it('1 given DON!! in total: still 4000', () => {
    const g = field(1, 0);
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(4000);
  });

  it('2 given to the Leader: +2000 → 6000', () => {
    const g = field(2, 0);
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(6000);
  });

  it('"a total": 1 on the Leader + 1 on another Character → 6000', () => {
    const g = field(1, 1);
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(6000);
  });

  it('2 given to Luffy itself on your turn: 4000 + 2000 (DON!!) + 2000 (this effect) = 8000', () => {
    const g = field(0, 0, 2);
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(8000);
  });

  it('it is a state check on the opponent’s turn too: 2 given DON!! on the Leader → 6000 (DON!! add no power then)', () => {
    const g = theirTurn(
      sideL({ card: LB.redShc, don: 2 }, F.red, { characters: [LUFFY] }),
      side(LB.opp, F.red),
    );
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only your own given DON!! count: 2 DON!! given to the opponent’s Leader do not', () => {
    const g = myTurn(
      side(LB.redShc, F.red, { characters: [LUFFY] }),
      sideL({ card: LB.opp, don: 2 }, F.red),
    );
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(4000);
  });
});

describe('OP12-015 [On Play]: you may reveal 2 Events: play up to 1 red Character with 3000 power or less; then give up to 1 rested DON!!', () => {
  const HAND: CardId[] = [EV.kick, EV.asura, CH.sunny, CH.sai, CH.alvida, CH.kingdew];

  function playGame(hand: CardId[] = HAND, p1: Partial<PlayerSpec> = {}) {
    const g = myTurn(
      side(LB.redShc, F.red, { hand: [LUFFY, ...hand], costArea: { active: 4, rested: 0 }, ...p1 }),
      side(LB.opp, F.red),
    );
    play(g, g.find('p1', 'hand', LUFFY));
    return g;
  }

  it('the cost asks for 2 Events: only Events are offered (never Sunny or another Character)', () => {
    const g = playGame([EV.kick, EV.asura, EV.rashomon, CH.sunny]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(kind(g)).toBe('choose');
    const events = [EV.kick, EV.asura, EV.rashomon];
    expect(choiceCards(g).every((c) => (events as (string | null)[]).includes(c))).toBe(true);
    expect(choiceCards(g).length).toBeGreaterThan(0);
    act(g, { type: 'pick', choice: choices(g)[0]! });
    expect(choiceCards(g).every((c) => (events as (string | null)[]).includes(c))).toBe(true);
  });

  it('happy path: reveal 2 Events, play Sunny (red, 3000); the Events stay in hand; then a rested DON!! is given', () => {
    const g = playGame();
    accept(g);
    const events = [g.find('p1', 'hand', EV.kick), g.find('p1', 'hand', EV.asura)];
    const sunny = g.find('p1', 'hand', CH.sunny);
    drive(g, 'p1', { cost: events, picks: [[sunny], [g.leader('p1')]] });
    expect(g.card(sunny).zone).toBe('characters');
    expect(g.card(sunny).rested).toBe(false);
    expect(sortedIds(g, 'p1', 'hand')).toEqual(
      [EV.kick, EV.asura, CH.sai, CH.alvida, CH.kingdew].sort(),
    );
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3, given: 1 });
  });

  it('play candidates: only red Characters with 3000 power or less: Sunny (3000, boundary); not Sai (4000), Alvida (green 3000), Kingdew (7000), nor an Event', () => {
    const g = playGame();
    accept(g);
    choose(g, [g.find('p1', 'hand', EV.kick), g.find('p1', 'hand', EV.asura)]);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.sunny]);
  });

  it('the played Character does not pay its cost: only Luffy’s own 4 DON!! are rested', () => {
    const g = playGame();
    accept(g);
    drive(g, 'p1', {
      cost: [g.find('p1', 'hand', EV.kick), g.find('p1', 'hand', EV.asura)],
      picks: [[g.find('p1', 'hand', CH.sunny)], []],
    });
    expect(donOf(g, 'p1').rested + donOf(g, 'p1').given).toBe(4);
  });

  it('CR 4-10-2: the DON!! is given to the freshly played Character too (a candidate for the recipient)', () => {
    const g = playGame();
    accept(g);
    const sunny = g.find('p1', 'hand', CH.sunny);
    drive(g, 'p1', {
      cost: [g.find('p1', 'hand', EV.kick), g.find('p1', 'hand', EV.asura)],
      picks: [[sunny], [sunny]],
    });
    expect(g.card(sunny).don).toBe(1);
    expect(g.power(sunny)).toBe(4000);
  });

  it('declining the reveal: nothing is played and no DON!! is given', () => {
    const g = playGame();
    decline(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LUFFY]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 4, given: 0 });
  });

  it('with only 1 Event in hand the cost cannot be paid: nothing is played or given', () => {
    const g = playGame([EV.kick, CH.sunny]);
    if (offered(g, 'p1')) decline(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LUFFY]);
    expect(donOf(g, 'p1').given).toBe(0);
  });

  it('"up to 1": no red Character with 3000 power or less in hand → nothing to play, but the DON!! is still given (CR 4-10-2)', () => {
    const g = playGame([EV.kick, EV.asura, CH.sai, CH.kingdew]);
    accept(g);
    drive(g, 'p1', {
      cost: [g.find('p1', 'hand', EV.kick), g.find('p1', 'hand', EV.asura)],
      picks: [[], [g.leader('p1')]],
    });
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LUFFY]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('only a rested DON!! can be given: with the 4 DON!! all rested after paying, one goes to the chosen card', () => {
    const g = playGame(HAND, { costArea: { active: 5, rested: 0 } });
    accept(g);
    drive(g, 'p1', {
      cost: [g.find('p1', 'hand', EV.kick), g.find('p1', 'hand', EV.asura)],
      picks: [[], [g.leader('p1')]],
    });
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 3, given: 1 });
  });

  it('given DON!! count for the permanent effect: after giving 1 DON!! (total 1) Luffy stays 4000; with a second given DON!! he is 6000+', () => {
    const g = playGame(HAND, { leader: { card: LB.redShc, don: 1 } });
    accept(g);
    drive(g, 'p1', {
      cost: [g.find('p1', 'hand', EV.kick), g.find('p1', 'hand', EV.asura)],
      picks: [[], [g.leader('p1')]],
    });
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(g.power(g.find('p1', 'characters', LUFFY))).toBe(6000);
  });
});
