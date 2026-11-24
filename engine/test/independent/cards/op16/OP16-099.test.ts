/**
 * OP16-099 I've Come Here... To Cut Those Chains!!! (Event, Black, cost 1, {Land of Wano}).
 *
 * Card text: "[Main] You may rest 6 of your DON!! cards: Trash 5 cards from the top of your deck. Then,
 * play up to 1 {Land of Wano} type Character card with a cost of 6 or less from your trash.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1-3 (cost), CR 2-7-2 / CR 6-5-3 (resting DON!! needs active DON!!), CR 7-1-3-1-2
 * (Event [Counter]), RL-08 ("during this battle"), a played Event is trashed after it resolves.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  atMain,
  attack,
  canCounterNow,
  cardIds,
  chars,
  deck,
  deckOf,
  don,
  kind,
  LD16,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  pickCards,
  playCard,
  SC16,
  SCN,
  takeDamage,
  theirs,
  trash,
  unusable,
  yes,
  at,
  act,
  BLUE,
} from './kit-op16c.ts';

const ID = 'OP16-099';

function main(o: { active?: number; rested?: number; deckTop?: string[]; trash?: string[] } = {}) {
  return mine(LD16.wano, {
    hand: [ID],
    deck: deckOf(o.deckTop ?? [BLUE, BLUE, BLUE, BLUE, BLUE]),
    trash: o.trash ?? [],
    costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
  });
}

/** Play the Event and accept the "rest 6 DON!!" cost. */
function useIt(g: ReturnType<typeof main>) {
  playCard(g, ID);
  yes(g, 'p1'); // the 6 DON!! are all active cost-area DON!!: one class, paid without a further question
}

describe("OP16-099 I've Come Here...: [Main] rest 6 DON!!: trash 5 from the deck, then play a {Land of Wano} Character (cost 6 or less) from the trash", () => {
  it("rests 6 DON!! (7 with the Event's own cost), trashes 5 from the top, and plays the chosen {Land of Wano} Character", () => {
    const g = main({ trash: [SC16.wano5] });
    useIt(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SC16.wano5]);
    expect(atMain(g)).toBe(true);
    expect(don(g).rested).toBe(7);
    expect(don(g).active).toBe(3);
    expect(deck(g)).toHaveLength(10);
    expect(chars(g)).toEqual([SC16.wano5]);
    expect(cardIds(g, 'p1', 'trash')).toContain(ID);
  });

  it('exactly 5 cards are trashed from the top of the deck', () => {
    const g = main({ deckTop: [SC16.wano1, SC16.wano3, BLUE, BLUE, BLUE, SC16.wano6] });
    useIt(g);
    none(g);
    expect(trash(g)).toEqual([ID, SC16.wano1, SC16.wano3, BLUE, BLUE, BLUE].sort());
    expect(deck(g)[0]).toBe(SC16.wano6);
  });

  it('a {Land of Wano} Character just trashed from the deck may be the one played', () => {
    const g = main({ deckTop: [SC16.wano3, BLUE, BLUE, BLUE, BLUE] });
    useIt(g);
    expect(offeredIds(g)).toEqual([SC16.wano3]);
    pickCards(g, [SC16.wano3]);
    expect(chars(g)).toEqual([SC16.wano3]);
  });

  it('boundary: cost 6 is offered, cost 7 is not; non-{Land of Wano} Characters and Events are not', () => {
    const g = main({ trash: [SC16.wano6, SC16.wano7, SCN.c3, ID] });
    useIt(g);
    expect(offeredIds(g)).toEqual([SC16.wano6]);
  });

  it('cost boundary: with 7 active DON!! (1 for the Event + 6) the effect is usable; with 6 it is not', () => {
    const ok = main({ active: 7 });
    useIt(ok);
    expect(don(ok).rested).toBe(7);

    const short = main({ active: 6 });
    playCard(short, ID);
    unusable(short, 'p1');
    expect(atMain(short)).toBe(true);
    expect(deck(short)).toHaveLength(15);
    expect(trash(short)).toEqual([ID]);
  });

  it("declining the optional cost: no DON!! rested beyond the Event's cost, nothing trashed, nothing played", () => {
    const g = main({ trash: [SC16.wano5] });
    playCard(g, ID);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(don(g).rested).toBe(1);
    expect(deck(g)).toHaveLength(15);
    expect(chars(g)).toEqual([]);
  });

  it('"up to 1": may play nothing after the deck has been trashed', () => {
    const g = main({ trash: [SC16.wano5] });
    useIt(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
  });

  it('plays at most one Character', () => {
    const g = main({ trash: [SC16.wano5, SC16.wano3, SC16.wano1] });
    useIt(g);
    pickCards(g, [SC16.wano5]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([SC16.wano5]);
  });
});

describe("OP16-099 I've Come Here...: [Counter] my Leader gains +3000 power during this battle", () => {
  function defend(attacker: string) {
    const g = theirs(
      LD16.wano,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [attacker] },
    );
    attack(g, at(g, 'p2', 'characters', attacker), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('is usable in the Counter Step and lifts my 5000 Leader to 8000: a 7000 attacker is stopped', () => {
    const g = defend(SCN.c5);
    expect(kind(g)).toBe('counter');
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(true);
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: an 8000 attacker ties with the 8000 Leader and still connects', () => {
    const g = defend(SCN.c6);
    activateCounter(g, g.find('p1', 'hand', ID));
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the bonus ends with the battle', () => {
    const g = defend(SCN.c5);
    activateCounter(g, g.find('p1', 'hand', ID));
    act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it is not usable as a [Main] effect from the [Counter] text alone: playing it in my Main Phase does the [Main] effect only', () => {
    const g = main({ active: 3 });
    playCard(g, ID);
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
