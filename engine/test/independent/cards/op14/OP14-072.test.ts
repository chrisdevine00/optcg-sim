/**
 * OP14-072 Baby 5 (Character, Purple, cost 4, 1000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[On Play] Add up to 1 DON!! card from your DON!! deck and set it as active.
 * [On K.O.] DON!! −1: Add up to 1 card from the top of your deck to the top of your Life cards."
 *
 * Rules: "add up to N DON!!" asks a count; DON!! −1 is a "may" cost (CR 8-3-1-4, RL-52); a card added
 * to Life from the deck goes face down to the top (CR 3-10-2-1), and Life added by an effect never
 * activates a [Trigger] (RL-25 family, rules-digest 104).
 */
import { act } from '../../helpers.ts';
import { describe, expect, it } from 'vitest';
import { koEffect } from '../op15/kit-op15c.ts';
import {
  addDon,
  at,
  backToMain,
  chars,
  countOptions,
  deck,
  donOf14,
  koGame,
  LD14,
  LIGHTNING,
  mine,
  need,
  no,
  onField,
  payDon,
  playRaw,
  SC14,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op14c.ts';

const ID = 'OP14-072';
const TOP = SC14.c4; // a distinguishable top-of-deck card (Hajrudin)

describe('OP14-072 Baby 5 [On Play] add up to 1 active DON!!', () => {
  it('asks how many (up to 1); adding 1 puts an ACTIVE DON!! in the cost area', () => {
    const g = mine(LD14.dp, { hand: [ID], costArea: { active: 8, rested: 0 } });
    playRaw(g, ID);
    expect(countOptions(g).sort()).toEqual(['0', '1']);
    addDon(g, 1);
    backToMain(g, 'p1');
    expect(donOf14(g)).toMatchObject({ active: 5, rested: 4, deck: 1 });
    expect(chars(g)).toEqual([ID]);
  });

  it('adding none adds nothing; the play still completes', () => {
    const g = mine(LD14.dp, { hand: [ID], costArea: { active: 8, rested: 0 } });
    playRaw(g, ID);
    addDon(g, 0);
    backToMain(g, 'p1');
    expect(donOf14(g)).toMatchObject({ active: 4, rested: 4, deck: 2 });
  });
});

/** Baby 5 K.O.'d in battle with 3 active DON!!; my deck's top card is Hajrudin. */
function ko(o: { active?: number } = {}) {
  return koGame(ID, {
    p1: {
      deck: [TOP, ...Array.from({ length: 12 }, () => SC14.c1)],
      costArea: { active: o.active ?? 3, rested: 0 },
    },
  });
}

/** After paying DON!! −1 the effect asks whether to add the top card ("up to 1"): yes. */
function addIt(g: ReturnType<typeof ko>, add = true): void {
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: add });
}

describe('OP14-072 Baby 5 [On K.O.] DON!! −1: add the top card of the deck to the top of Life', () => {
  it('is offered; paying DON!! −1 returns 1 DON!! and puts the deck’s top card on top of my Life', () => {
    const g = ko();
    need(g, 'optional', 'p1');
    const lifeBefore = g.life('p1');
    yes(g, 'p1');
    payDon(g, 1);
    addIt(g);
    backToMain(g, 'p2');
    expect(onField(g)).toBe(2);
    expect(donOf14(g).deck).toBe(8);
    expect(g.life('p1')).toBe(lifeBefore + 1);
    expect(g.zone('p1', 'life')[0]!.card).toBe(TOP);
    expect(deck(g)).toHaveLength(12);
    expect(trash(g)).toEqual([ID]);
  });

  it('the added Life card is face down', () => {
    const g = ko();
    yes(g, 'p1');
    payDon(g, 1);
    addIt(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('"you may": declining pays nothing and adds no Life', () => {
    const g = ko();
    no(g, 'p1');
    backToMain(g, 'p2');
    expect(onField(g)).toBe(3);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(13);
  });

  it('with no DON!! on my field the cost cannot be paid and no Life is added', () => {
    const g = ko({ active: 0 });
    unusable(g, 'p1');
    backToMain(g, 'p2');
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(13);
  });

  it('"up to 1": the card may be declined after paying; the DON!! stays returned', () => {
    const g = ko();
    yes(g, 'p1');
    payDon(g, 1);
    addIt(g, false);
    backToMain(g, 'p2');
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(13);
    expect(onField(g)).toBe(2);
  });

  it('a card added to Life by this effect does not activate a [Trigger]', () => {
    const g = koGame(ID, {
      p1: { deck: ['OP01-104', ...Array.from({ length: 12 }, () => SC14.c1)] },
    });
    yes(g, 'p1');
    payDon(g, 1);
    addIt(g);
    backToMain(g, 'p2');
    expect(g.zone('p1', 'life')[0]!.card).toBe('OP01-104');
    expect(chars(g)).toEqual([]);
  });

  it('works after an effect K.O. too', () => {
    const g = theirs(
      LD14.dp,
      {
        characters: [ID],
        deck: [TOP, ...Array.from({ length: 12 }, () => SC14.c1)],
        costArea: { active: 3, rested: 0 },
      },
      { hand: [LIGHTNING], costArea: { active: 9, rested: 0 } },
    );
    koEffect(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDon(g, 1);
    addIt(g);
    expect(g.zone('p1', 'life')[0]!.card).toBe(TOP);
    expect(onField(g)).toBe(2);
  });

  it('must not fire on play: playing it does not add Life', () => {
    const g = mine(LD14.dp, { hand: [ID], costArea: { active: 8, rested: 0 } });
    playRaw(g, ID);
    addDon(g, 0);
    expect(g.life('p1')).toBe(4);
  });
});
