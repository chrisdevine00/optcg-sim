/**
 * OP05-115 Two-Hundred Million Volts Amaru (Event, Yellow, cost 2, {Sky Island}).
 *
 * Card text: "[Main] Up to 1 of your Leader or Character cards gains +3000 power during this turn. Then, if
 * you have 1 or less Life cards, rest up to 1 of your opponent's Characters with a cost of 4 or less.
 * [Trigger] You may trash 2 cards from your hand: Add up to 1 card from the top of your deck to the top
 * of your Life cards."
 *
 * Rules: CR 8-4-4-1 ("up to" allows 0), CR 8-3-3 (the "if"), RL-09 ("during this turn"), CR 8-3-1-3/-4
 * (costs), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  cardOf,
  choiceCards,
  choices,
  choose,
  chooseNone,
  declineAny,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  kind,
  lifeCards,
  mine,
  payWith,
  playEvent,
  RED,
  SC,
  settleYes,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const EVENT = 'OP05-115';
const OPP = [VAN.kingdew, VAN.marco, VAN.hajrudin]; // costs 5, 3, 4

function played(life: string[], chars: string[] = []) {
  const g = mine(
    YL.sky,
    { hand: [EVENT], life, characters: chars, costArea: { active: 2, rested: 0 } },
    { characters: OPP },
  );
  playEvent(g, EVENT);
  return g;
}

const power = (g: ReturnType<typeof mine>, p: 'p1' | 'p2', card?: string) =>
  g.power(card ? g.find(p, 'characters', card) : g.leader(p));

describe('OP05-115 Amaru: [Main] +3000 this turn, then with 1 or less Life rest a Character of cost 4 or less', () => {
  it('1 Life: Leader +3000, and an opposing Character with cost 4 or less is rested (cost 5 is not a candidate)', () => {
    const g = played([RED]);
    // First selection: the power target.
    expect(kind(g)).toBe('choose');
    choose(g, [g.leader('p1')]);
    expect(power(g, 'p1')).toBe(8000);
    expect(choiceCards(g).sort()).toEqual([VAN.marco, VAN.hajrudin].sort());
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.hajrudin)!]);
    settleYes(g, 'p1');
    expect(g.card(g.find('p2', 'characters', VAN.hajrudin)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', VAN.marco)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', VAN.kingdew)).rested).toBe(false);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('0 Life also meets "1 or less"', () => {
    const g = played([]);
    choose(g, [g.leader('p1')]);
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.marco)!]);
    settleYes(g, 'p1');
    expect(g.card(g.find('p2', 'characters', VAN.marco)).rested).toBe(true);
  });

  it('CR 8-3-3: with 2 Life only the +3000 happens; nothing is rested', () => {
    const g = played([RED, RED]);
    choose(g, [g.leader('p1')]);
    settleYes(g, 'p1');
    expect(power(g, 'p1')).toBe(8000);
    for (const c of OPP) expect(g.card(g.find('p2', 'characters', c)).rested).toBe(false);
  });

  it('the +3000 can go to one of my Characters instead of the Leader', () => {
    const g = played([RED, RED], [SC.genbo]);
    choose(g, [g.find('p1', 'characters', SC.genbo)]);
    settleYes(g, 'p1');
    expect(power(g, 'p1', SC.genbo)).toBe(8000);
    expect(power(g, 'p1')).toBe(5000);
  });

  it('"up to 1": may boost nobody; "up to 1": may rest nobody', () => {
    const g = played([RED]);
    chooseNone(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(power(g, 'p1')).toBe(5000);
    for (const c of OPP) expect(g.card(g.find('p2', 'characters', c)).rested).toBe(false);
  });

  it('"during this turn": the +3000 lasts through the turn and ends with it', () => {
    const g = played([RED, RED]);
    choose(g, [g.leader('p1')]);
    settleYes(g, 'p1');
    expect(power(g, 'p1')).toBe(8000);
    endTurn(g);
    expect(power(g, 'p1')).toBe(5000);
  });

  it('rests at most one Character', () => {
    const g = played([RED]);
    choose(g, [g.leader('p1')]);
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.marco)!]);
    settleYes(g, 'p1');
    expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(1);
  });
});

describe('OP05-115 Amaru: [Trigger] you may trash 2 cards: add up to 1 deck card to the top of Life', () => {
  function hit(handCards: string[]) {
    const g = theirs(YL.sky, {
      life: [EVENT, ...fill(BLUE, 3)],
      hand: handCards,
      deck: [SC.bobbin, ...fill(BLUE, 10)],
    });
    hitLeader(g);
    return g;
  }

  it('paying 2 cards: the deck top goes on top of Life (hit: 3 Life -> 4)', () => {
    const g = hit([SC.opera, SC.anana, VAN.marco]);
    activateTrigger(g);
    payWith(g, [g.find('p1', 'hand', SC.opera), g.find('p1', 'hand', SC.anana)]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(lifeCards(g)[0]).toBe(SC.bobbin);
    expect(trash(g)).toEqual([EVENT, SC.opera, SC.anana].sort());
    expect(hand(g)).toEqual([VAN.marco]);
    expect(deck(g)).toHaveLength(10);
  });

  it('CR 8-3-1-3: with only 1 card in hand the [Trigger] cannot be activated (its cost cannot be paid)', () => {
    const g = hit([SC.opera]);
    expect(kind(g)).toBe('trigger');
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(false);
    declineTrigger(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([EVENT, SC.opera].sort());
  });

  it('with exactly 2 cards in hand the cost can be paid (both are trashed)', () => {
    const g = hit([SC.opera, SC.anana]);
    activateTrigger(g);
    payWith(g, [g.find('p1', 'hand', SC.opera), g.find('p1', 'hand', SC.anana)]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(g.life('p1')).toBe(4);
  });

  it('"up to 1": after paying, the Life card may be declined (the 2 cards are still trashed)', () => {
    const g = hit([SC.opera, SC.anana]);
    activateTrigger(g);
    payWith(g, [g.find('p1', 'hand', SC.opera), g.find('p1', 'hand', SC.anana)]);
    declineAny(g);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toContain(SC.opera);
  });

  it('declining the [Trigger] puts Amaru in hand', () => {
    const g = hit([SC.opera, SC.anana]);
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT, SC.opera, SC.anana].sort());
  });
});
