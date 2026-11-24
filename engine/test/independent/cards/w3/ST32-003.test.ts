/**
 * ST32-003 Dracule Mihawk (Character, Green, cost 6, 7000, no Counter, {The Seven Warlords of the
 * Sea}/{Muggy Kingdom}).
 *
 * Card text: "[Your Turn] When this Character becomes rested, draw 1 card and trash 1 card from your
 * hand. [On Play] If your Leader has the <Slash> attribute, play up to 1 Character card with a cost
 * of 5 or less that is either [Perona] or has the <Slash> attribute from your hand."
 *
 * Open: M6b-Q30 / M6b-Q41 (does a rest caused by the Character's own attack, or by a cost, count as
 * "becomes rested"?). Every rest below is caused by an effect of the opponent, which every reading
 * counts; no test asserts what an attack or a cost does. Rules: [Your Turn] holds during my turn
 * only (CR 8-3-2-4); "draw 1 and trash 1" is in that order, the trash is not "up to"; "up to"
 * allows 0 (CR 8-4-4-1); a Character played by an effect pays no cost (CR 8-4-9-1).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  cardIds,
  choices,
  decision,
  deck,
  endUpTo,
  hand,
  kind,
  mine,
  need,
  n,
  offeredIds,
  passBlock,
  payDonStrict,
  pickInst,
  theirs,
  trash,
  W3C,
  W3L,
  yes,
  don,
} from './kit-w3.ts';

const MIHAWK = 'ST32-003';
/** EB05-015 Tashigi: Green, cost 5, 7000, {Navy}/{East Blue}, <Slash>, vanilla. */
const SLASH5 = 'EB05-015';
/** EB01-022 Inazuma: Blue, cost 6, 7000, <Slash>. */
const SLASH6 = 'EB01-022';
/** ST12-005 Perona: Green, cost 4, 6000, <Special>, vanilla. Named [Perona], no <Slash>. */
const PERONA = 'ST12-005';

describe('ST32-003 Dracule Mihawk: [On Play] <Slash> Leader: play a [Perona] or <Slash> Character with cost 5 or less', () => {
  const play = (leader: string, inHand: string[]) => {
    const g = mine(leader, { hand: [MIHAWK, ...inHand] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MIHAWK) });
    return g;
  };

  it('with a <Slash> Leader: offers [Perona] and <Slash> Characters of cost 5 or less (5 included), and plays the chosen one', () => {
    const g = play(W3L.slash, [W3C.sai, SLASH5, PERONA]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PERONA, SLASH5, W3C.sai].sort());
    pickInst(g, [g.find('p1', 'hand', SLASH5)]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([MIHAWK, SLASH5].sort());
    expect(hand(g)).toEqual([PERONA, W3C.sai].sort());
  });

  it('not offered: a <Slash> Character of cost 6, a Character that is neither [Perona] nor <Slash>, an Event', () => {
    const g = play(W3L.slash, [SLASH6, W3C.marco, W3C.bounce, W3C.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W3C.sai]);
  });

  it('[Perona] qualifies without the <Slash> attribute', () => {
    const g = play(W3L.slash, [PERONA]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', PERONA)]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([MIHAWK, PERONA].sort());
  });

  it("the Character is played for free: only Mihawk's own 6 DON!! are spent", () => {
    const g = play(W3L.slash, [SLASH5]);
    pickInst(g, [g.find('p1', 'hand', SLASH5)]);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });

  it('"up to 1": may play nothing', () => {
    const g = play(W3L.slash, [W3C.sai]);
    endUpTo(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([MIHAWK]);
    expect(hand(g)).toEqual([W3C.sai]);
  });

  it('plays at most one Character even when several qualify', () => {
    const g = play(W3L.slash, [W3C.sai, SLASH5]);
    pickInst(g, [g.find('p1', 'hand', W3C.sai)]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toHaveLength(2);
    expect(hand(g)).toEqual([SLASH5]);
  });

  it('without a <Slash> Leader nothing is offered', () => {
    const g = play(W3L.kid, [W3C.sai, SLASH5, PERONA]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([MIHAWK]);
    expect(hand(g)).toEqual([PERONA, SLASH5, W3C.sai].sort());
  });
});

describe('ST32-003 Dracule Mihawk: [Your Turn] when it becomes rested, draw 1 card and trash 1 card from hand', () => {
  /**
   * My turn: Mihawk and Thatch are active; Thatch attacks p2's Leader; p2 holds Slow-Slow Beam
   * Sword ([Counter] DON!! -1: +2000, then rest up to 1 of my Characters) and uses it on Mihawk.
   */
  function restedByOpponent(target: 'mihawk' | 'thatch' | 'none' = 'mihawk') {
    const g = mine(
      W3L.kid,
      {
        characters: [MIHAWK, W3C.thatch],
        hand: [W3C.sai, W3C.marco],
        deck: [W3C.hajrudin, ...Array(14).fill(W3C.sai)],
      },
      { hand: ['OP07-076'], costArea: { active: 3, rested: 0 } },
    );
    attack(g, g.find('p1', 'characters', W3C.thatch), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'activate', card: g.find('p2', 'hand', 'OP07-076'), ability: 'counter' });
    yes(g, 'p2');
    payDonStrict(g, 1);
    pickInst(g, [g.leader('p2')]); // the +2000 target
    need(g, 'choose', 'p2'); // rest up to 1 of my Characters
    if (target === 'none') endUpTo(g);
    else pickInst(g, [g.find('p1', 'characters', target === 'mihawk' ? MIHAWK : W3C.thatch)]);
    return g;
  }

  it("rested by the opponent's effect on my turn: I draw 1 card, then trash 1 card from my hand", () => {
    const g = restedByOpponent();
    need(g, 'choose', 'p1');
    // The drawn card (Hajrudin) is already in the hand and may be the one trashed.
    expect(offeredIds(g)).toEqual([W3C.hajrudin, W3C.marco, W3C.sai].sort());
    pickInst(g, [g.find('p1', 'hand', W3C.marco)]);
    expect(trash(g)).toEqual([W3C.marco]);
    expect(hand(g)).toEqual([W3C.hajrudin, W3C.sai].sort());
    expect(deck(g)).toHaveLength(14);
  });

  it('the trash is not "up to": exactly 1 card must be trashed (no way to end the choice empty)', () => {
    const g = restedByOpponent();
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('the newly drawn card may itself be the one trashed', () => {
    const g = restedByOpponent();
    pickInst(g, [g.find('p1', 'hand', W3C.hajrudin)]);
    expect(trash(g)).toEqual([W3C.hajrudin]);
    expect(hand(g)).toEqual([W3C.marco, W3C.sai].sort());
  });

  it('it draws exactly 1 card (the next card of the deck stays put)', () => {
    const g = restedByOpponent();
    pickInst(g, [g.find('p1', 'hand', W3C.marco)]);
    expect(n(g, 'p1', 'hand')).toBe(2);
    expect(deck(g)[0]).toBe(W3C.sai);
  });

  it('another Character of mine becoming rested does not trigger it (Thatch rested instead of Mihawk)', () => {
    const g = restedByOpponent('thatch');
    expect(g.card(g.find('p1', 'characters', W3C.thatch)).rested).toBe(true);
    expect(decision(g)?.player).not.toBe('p1');
    expect(hand(g)).toEqual([W3C.marco, W3C.sai].sort());
    expect(trash(g)).toEqual([]);
  });

  it('Thatch resting to attack does not trigger Mihawk: no draw happens in an attack with Mihawk idle', () => {
    const g = mine(
      W3L.kid,
      { characters: [MIHAWK, W3C.thatch], hand: [W3C.sai] },
      { characters: [{ card: W3C.marco, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', W3C.thatch), g.find('p2', 'characters', W3C.marco));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(g.card(g.find('p1', 'characters', MIHAWK)).rested).toBe(false);
    expect(hand(g)).toEqual([W3C.sai]);
    expect(kind(g)).toBe('main');
  });

  it("[Your Turn]: rested by the opponent's effect on THEIR turn, nothing is drawn or trashed", () => {
    // OP17-038 (cost 0): "[Main] You may rest 4 of your cards: Rest up to 1 of your opponent's Characters."
    const g = theirs(
      W3L.kid,
      { characters: [MIHAWK], hand: [W3C.sai, W3C.marco] },
      { hand: ['OP17-038'], costArea: { active: 10, rested: 0 } },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', 'OP17-038') });
    yes(g, 'p2');
    if (kind(g) === 'choose' && decision(g)?.purpose === 'cost') payDonStrict(g, 4);
    pickInst(g, [g.find('p1', 'characters', MIHAWK)]);
    expect(g.card(g.find('p1', 'characters', MIHAWK)).rested).toBe(true);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([W3C.marco, W3C.sai].sort());
    expect(trash(g)).toEqual([]);
    expect(n(g, 'p1', 'deck')).toBe(15);
    void choices;
  });
});
