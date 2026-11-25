/**
 * ST22-016 Take That Back!! Take Back What You Said!! (Event, Blue, cost 1, {Whitebeard Pirates}).
 *
 * Card text: "[Counter] Reveal 1 card from the top of your deck. If that card's type includes
 * "Whitebeard Pirates", up to 1 of your Leader or Character cards gains +4000 power during this
 * battle.
 * [Trigger] Draw 1 card."
 *
 * Rules: CR 7-1-3 (Counter Step), CR 10-1-5 ([Trigger]), RL-44 (the revealed card stays on top).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  activateCounter,
  activateTrigger,
  canCounterNow,
  canFinish,
  choices,
  declineTrigger,
  deck,
  donOf,
  hand,
  hasEvent,
  kind,
  LB,
  need,
  none,
  passBlock,
  pickInst,
  SL,
  theirs,
  trash,
  mine,
} from './kit-lfb.ts';

const ID = 'ST22-016';
const MISS = SL.miss;
const PAD = Array.from({ length: 10 }, () => MISS);

/** p2 attacks p1's Leader with its Leader (5000 vs 5000); p1 holds the Event and is at the Counter Step. */
function defend(top: string[], o: { chars?: string[] } = {}) {
  const g = theirs(
    LB.neutral,
    {
      hand: [ID],
      characters: o.chars ?? [],
      deck: [...top, ...PAD],
      costArea: { active: 5, rested: 0 },
    },
    { characters: [SL.c1] },
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe('ST22-016 Take That Back!!: [Counter] reveal the top card; if Whitebeard Pirates, +4000 this battle', () => {
  it('a hit: my Leader gains +4000 this battle and the 5000 attack no longer connects', () => {
    const g = defend([SL.wb4, SL.c2]);
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
  });

  it('costs 1 DON!!', () => {
    const g = defend([SL.wb4]);
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(donOf(g, 'p1').active).toBe(4);
  });

  it('a miss: no target is asked, no boost, and the attack connects', () => {
    const g = defend([SL.c2, SL.wb4]);
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(kind(g)).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(deck(g)[0]).toBe(SL.c2);
    act(g, { type: 'endCounter' });
    declineTrigger(g);
    expect(g.life('p1')).toBe(3);
  });

  it('"type including": Former and Allies types are a hit; a Red-Haired type is a miss', () => {
    for (const top of [SL.former3, SL.allies6]) {
      const g = defend([top]);
      activateCounter(g, g.find('p1', 'hand', ID));
      expect(kind(g)).toBe('choose');
    }
    const g = defend([SL.rhp4]);
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(kind(g)).toBe('counter');
  });

  it('the top card is revealed on a hit and on a miss (CR 11-2-1)', () => {
    const hit = defend([SL.wb4]);
    activateCounter(hit, hit.find('p1', 'hand', ID));
    expect(hasEvent(hit, 'CardRevealed', { card: SL.wb4 })).toBe(true);
    const miss = defend([SL.c2]);
    activateCounter(miss, miss.find('p1', 'hand', ID));
    expect(hasEvent(miss, 'CardRevealed', { card: SL.c2 })).toBe(true);
  });

  it('the boost may go to one of my Characters instead of the Leader', () => {
    const g = defend([SL.wb4], { chars: [SL.c2] });
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).toContain(at(g, 'p1', 'characters', SL.c2));
    pickInst(g, [at(g, 'p1', 'characters', SL.c2)]);
    expect(g.power(at(g, 'p1', 'characters', SL.c2))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("only my own Leader or Characters are candidates, not the opponent's", () => {
    const g = defend([SL.wb4]);
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([g.leader('p1')]);
  });

  it('"up to 1": the target may be left out; no boost and the attack connects', () => {
    const g = defend([SL.wb4]);
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    act(g, { type: 'endCounter' });
    declineTrigger(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the boost lasts for this battle only', () => {
    const g = defend([SL.wb4]);
    activateCounter(g, g.find('p1', 'hand', ID));
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not happen: it has no [Main], so it cannot be played in the Main Phase', () => {
    const g = mine(LB.neutral, { hand: [ID] });
    expect(atMain(g)).toBe(true);
    const card = g.find('p1', 'hand', ID);
    expect(g.decider).toBe('p1');
    expect(g.legal().some((a) => a.type === 'playCard' && a.card === card)).toBe(false);
    expect(canCounterNow(g, card)).toBe(false);
  });
});

describe('ST22-016 Take That Back!!: [Trigger] draw 1 card', () => {
  /** p2 hits p1's Leader; the top Life card is the Event. */
  const hit = () => {
    const g = theirs(LB.neutral, {
      life: [ID, MISS, MISS, MISS],
      deck: [SL.c2, SL.c4, ...PAD],
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  };

  it('activating the Trigger draws 1 card and the Event goes to the trash, not the hand', () => {
    const g = hit();
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g)).toEqual([SL.c2]);
    expect(trash(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the Trigger adds the Event to the hand and draws nothing', () => {
    const g = hit();
    need(g, 'trigger', 'p1');
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(deck(g)[0]).toBe(SL.c2);
    expect(trash(g)).toEqual([]);
  });

  it('the Trigger draws exactly 1 card, and its [Counter] text does not run (no reveal)', () => {
    const g = hit();
    activateTrigger(g);
    expect(hand(g)).toHaveLength(1);
    expect(hasEvent(g, 'CardRevealed', { card: SL.c2 })).toBe(false);
  });
});
