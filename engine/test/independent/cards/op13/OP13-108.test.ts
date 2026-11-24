/**
 * OP13-108 Jewelry Bonney (Character, Yellow, cost 9, 10000, no Counter, {Bonney Pirates}/{Egghead}).
 *
 * Card text: "[On Play] If your Leader has the "Egghead" type, this Character gains [Rush] during this
 * turn. Then, your opponent adds 1 card from the top of their Life cards to their hand. [Trigger]
 * If you have 1 or less Life cards, rest up to 1 of your opponent's Characters with a cost of 7 or
 * less."
 *
 * Rules: CR 10-1-1 ([Rush]), CR 8-3-3 and CR 4-10-1 (a "Then" after a failed "If" does not resolve,
 * OPEN-QUESTIONS M4b-5), RD 104 (Life moved by an effect never activates [Trigger]), RD 102 (a
 * [Trigger] card is in no area while it resolves), CR 8-4-4-1 ("up to"). Scenery: EB04-001 (Egghead
 * Leader), ST09-001 (not Egghead), OP17-107 Daifuku (a [Trigger] card to sit on the opposing Life).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  canHit,
  chars,
  choices,
  declineTrigger,
  don,
  doneRaw,
  endTurn,
  hand,
  hitLeader,
  kind,
  LD13,
  lifeCards,
  mine,
  need,
  noDefence,
  offeredIds,
  pickRaw,
  playRaw,
  RED,
  S13,
  SC15,
  theirs,
  trash,
  attack,
} from './kit-op13d.ts';

const ID = 'OP13-108';
const DAI = S13.daifuku;

function start(o: { leader?: string; p2life?: string[]; p2hand?: string[] } = {}): TestGame {
  const g = mine(
    o.leader ?? LD13.eggMulti,
    { hand: [ID] },
    { life: o.p2life ?? [DAI, RED, RED, RED], hand: o.p2hand ?? [] },
  );
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP13-108 Jewelry Bonney: [On Play] if my Leader is {Egghead}, gains [Rush] this turn; then the opponent adds 1 Life card to their hand', () => {
  it('{Egghead} Leader: gains [Rush], and the opponent takes their top Life card into their hand with no question', () => {
    const g = start();
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Rush');
    expect(g.life('p2')).toBe(3);
    expect(hand(g, 'p2')).toEqual([DAI]);
    expect(lifeCards(g, 'p2')).toEqual([RED, RED, RED]);
  });

  it('[Rush] is real: it may attack the Leader the turn it is played, and each hit takes a Life card', () => {
    const g = start();
    const b = at(g, 'p1', 'characters', ID);
    expect(canHit(g, b, g.leader('p2'))).toBe(true);
    attack(g, b, g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
  });

  it('a Leader without the {Egghead} type: no [Rush], it cannot attack this turn', () => {
    const g = start({ leader: LD13.yellow });
    const b = at(g, 'p1', 'characters', ID);
    expect(g.card(b).keywords).not.toContain('Rush');
    expect(canHit(g, b, g.leader('p2'))).toBe(false);
  });

  // CR 4-10-1 / 8-3-3: "If ..., gains [Rush]. Then, your opponent adds ..." - after a failed "if" the
  // "Then" does not resolve (OPEN-QUESTIONS M4b-5, official OP13-118 / OP14-111 Q&As).
  it('a Leader without {Egghead}: the "Then" part does not resolve either, the opponent keeps all 4 Life cards', () => {
    const g = start({ leader: LD13.yellow });
    expect(g.life('p2')).toBe(4);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('{Egghead} also on a mono-colored Leader (ST29-001 Luffy) works', () => {
    const g = start({ leader: LD13.eggMono });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Rush');
    expect(g.life('p2')).toBe(3);
  });

  it('an opponent with 0 Life cards: nothing is added and the game goes on (no damage was dealt)', () => {
    const g = start({ p2life: [] });
    expect(atMain(g)).toBe(true);
    expect(g.life('p2')).toBe(0);
    expect(hand(g, 'p2')).toEqual([]);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('a [Trigger] card taken this way goes to the hand: the opponent gets no [Trigger] decision', () => {
    const g = start();
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toEqual([DAI]);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('the [Rush] lasts "during this turn" only', () => {
    const g = start();
    endTurn(g);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).not.toContain('Rush');
  });

  it('the cost 9 is paid (1 DON!! left active)', () => {
    const g = start();
    expect(don(g)).toMatchObject({ active: 1, rested: 9 });
  });
});

describe('OP13-108 Jewelry Bonney: [Trigger] if I have 1 or less Life, rest up to 1 Character with cost 7 or less', () => {
  const hit = (life: string[], p2: string[] = [SC15.red7, SC15.red6]) =>
    theirs(LD13.yellow, { life }, { characters: p2 });

  it('Life 2 with Bonney on top: after the damage 1 Life is left, so the Trigger rests a cost 7 Character', () => {
    const g = hit([ID, BLUE]);
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red6, SC15.red7].sort());
    pickRaw(g, at(g, 'p2', 'characters', SC15.red7));
    expect(g.card(at(g, 'p2', 'characters', SC15.red7)).rested).toBe(true);
    expect(g.life('p1')).toBe(1);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: a cost 8 Character is not offered', () => {
    const g = hit([ID, BLUE], [SC15.red7, 'OP12-005']);
    hitLeader(g);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([SC15.red7]);
  });

  it('Life 1 (Bonney alone): 0 Life are left, the condition holds', () => {
    const g = hit([ID]);
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SC15.red7));
    expect(g.card(at(g, 'p2', 'characters', SC15.red7)).rested).toBe(true);
  });

  it('boundary: Life 3 with Bonney on top leaves 2 Life cards: the condition fails, nothing is rested', () => {
    const g = hit([ID, BLUE, BLUE]);
    hitLeader(g);
    activateTrigger(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      doneRaw(g);
    }
    expect(g.card(at(g, 'p2', 'characters', SC15.red7)).rested).toBe(false);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": choosing nobody is legal', () => {
    const g = hit([ID, BLUE]);
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(g.card(at(g, 'p2', 'characters', SC15.red7)).rested).toBe(false);
  });

  it('declined: Bonney is added to the hand and nothing is rested', () => {
    const g = hit([ID, BLUE]);
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(g.card(at(g, 'p2', 'characters', SC15.red7)).rested).toBe(false);
  });
});
