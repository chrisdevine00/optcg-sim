/** EB03-026 Boa Hancock. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, don, expectDecision, giveMostEach, pick, play, times, V } from './helpers.ts';
import { activate, cardsIn, mk, offeredAb } from './helpers-eb03g1.ts';

const ID = 'EB03-026';

describe('EB03-026 Boa Hancock [On Play]', () => {
  const start = (n: number) =>
    mk({ hand: [ID] }, { hand: times(n, V.c1), deck: [V.c2, V.c3, ...times(5, BLUE)] });

  it('with 5 or more cards in the opponent hand: the opponent places 1 card of their choice at the bottom of their deck', () => {
    const g = mk({ hand: [ID] }, { hand: [V.c1, V.c2, V.c3, V.c4, V.c5], deck: [BLUE, BLUE] });
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p2');
    expect(d.player).toBe('p2');
    pick(g, [g.find('p2', 'hand', V.c3)]);
    expect(cardsIn(g, 'p2', 'hand')).toHaveLength(4);
    expect(g.zone('p2', 'deck').at(-1)!.card).toBe(V.c3);
    expect(g.zone('p2', 'deck')).toHaveLength(3);
  });

  it('boundary: exactly 5 fires, 4 does not', () => {
    const g5 = start(5);
    play(g5, ID);
    expect(dec(g5)?.kind).toBe('choose');
    const g4 = start(4);
    play(g4, ID);
    expectDecision(g4, 'main', 'p1');
    expect(cardsIn(g4, 'p2', 'hand')).toHaveLength(4);
  });

  it('the count is read as the effect resolves: a 6-card hand places exactly 1', () => {
    const g = start(6);
    play(g, ID);
    pick(g, [g.find('p2', 'hand', V.c1)]);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p2', 'hand')).toHaveLength(5);
  });
});

describe('EB03-026 Boa Hancock [Activate: Main]', () => {
  const start = (rested = 3, chars = [ID, V.c1, V.c2]) =>
    mk({ characters: chars, costArea: { active: 2, rested } }, { characters: [V.c3] });

  it('places 1 of your Characters at the bottom of your deck as the cost, then gives your Leader and 1 Character 1 rested DON!! each', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.find('p1', 'characters', V.c1)]); // the cost
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(V.c1);
    pick(g, [g.find('p1', 'characters', V.c2)]); // the Character to be given DON!!
    giveMostEach(g); // "up to 1" each: 1 or none per target (OP-18 review R8)
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, active: 2 });
  });

  it('is Once Per Turn', () => {
    const g = start();
    const id = g.find('p1', 'characters', ID);
    activate(g, id, 'give-don');
    pick(g, [g.find('p1', 'characters', V.c1)]);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(offeredAb(g, id, 'give-don')).toBe(false);
  });

  it('Hancock herself can be the Character placed; the DON!! then go to the Leader and another Character', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(ID);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    giveMostEach(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(1);
  });

  it('with only Hancock on the field: the cost places her, and the Leader still gets a DON!!', () => {
    const g = start(3, [ID]);
    activate(g, g.find('p1', 'characters', ID), 'give-don'); // the only Character: paid without a choice
    giveMostEach(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('with a single rested DON!! the player chooses which of the two gets it', () => {
    const g = start(1);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.find('p1', 'characters', V.c1)]);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    pick(g, [g.find('p1', 'characters', V.c2)]); // the one DON!! goes to the Character
    giveMostEach(g);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 0 });
  });

  it('with no rested DON!! nothing is given (the cost is still paid)', () => {
    const g = start(0);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.find('p1', 'characters', V.c1)]);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(0);
  });

  it("the opponent's Characters are never placed", () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(
      g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p2', 'characters', V.c3)),
    ).toBe(false);
  });
});
