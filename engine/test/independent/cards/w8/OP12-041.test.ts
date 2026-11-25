/**
 * OP12-041 Sanji (Leader, Blue/Purple, 5000, 4 Life, {Straw Hat Crew}/{The Vinsmoke Family}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] DON!! -1: Activate up to 1 "Straw Hat Crew" type Event
 * with a base cost of 3 or less from your hand. [When Attacking] If the number of DON!! cards on
 * your field is equal to or less than the number on your opponent's field, add up to 1 DON!! card
 * from your DON!! deck and rest it."
 *
 * Rules used: CR 8-3 (an activation cost is paid; a printed cost is not paid when an effect
 * activates the Event: official OP12-041 Q&A, M6b-Q27); only the [Main] effect of the Event is
 * activated, never its [Counter] or [Trigger] (same Q&A); the Event is trashed after it resolves
 * (M6b-Q27); it counts as activating an Event (M6b-Q28); "base cost" is the printed cost; DON!!
 * "on your field" counts the cost area and DON!! given to cards (CR 6-5-5-1); the Event is chosen
 * from the hand with an "up to" pick that is asked even when nothing matches, so the prompt never
 * depends on the hidden hand (M6b-Q93). M6b-Q92 (an Event whose own cost cannot be paid) is open:
 * only the outcome every reading shares is asserted.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  asksCount,
  asksDon,
  at,
  attack,
  canFinish,
  choices,
  C8,
  donCounts,
  E8,
  expectOffered,
  kind,
  L8,
  mine8,
  need,
  no,
  noDefence,
  offeredAbilities,
  offeredIds,
  pickCardId,
  pickInst,
  rawActivate,
  sortedCards,
  toMyNextMain,
  yes,
  decision,
  pickDonClass,
} from './kit-w8a.ts';

const SANJI = L8.sanji;

/** Sanji's [Activate: Main] with the "up to 1 Event" pick now pending. */
function activate(g: ReturnType<typeof mine8>): void {
  rawActivate(g, g.leader('p1'));
  // The DON!! -1 cost is paid without a choice when every own DON!! is in one state.
  if (asksDon(g, 'p1')) pickDonClass(g, 'costActive');
  need(g, 'choose', 'p1');
}

describe('OP12-041 Sanji: [Activate: Main] [Once Per Turn] DON!! -1: activate a Straw Hat Crew Event from hand', () => {
  it('printed values: Leader, 5000 power, 4 Life', () => {
    const g = mine8(SANJI);
    const l = g.card(g.leader('p1'));
    expect(l.power).toBe(5000);
    expect(g.life('p1')).toBe(4);
  });

  it('activating pays DON!! -1, activates the Event from the hand and trashes it; the Event cost is not paid', () => {
    const g = mine8(SANJI, { hand: [E8.concasser, C8.sai] });
    expect(donCounts(g, 'p1')).toMatchObject({ active: 10, rested: 0, deck: 0 });
    activate(g);
    pickCardId(g, E8.concasser);
    // Concasser: "If your Leader is [Sanji], draw 1 card."
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.concasser]);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([C8.mohji, C8.sai].sort());
    // 10 DON!! - 1 (the cost) = 9, none rested: the Event's printed cost 1 was not paid.
    expect(donCounts(g, 'p1')).toMatchObject({ active: 9, rested: 0, deck: 1 });
    expect(g.eventsOfType('EventActivated').length).toBe(1);
  });

  it('candidates are Straw Hat Crew Events with a base cost of 3 or less that have a [Main]', () => {
    const g = mine8(SANJI, {
      hand: [
        E8.concasser, // SHC, cost 1, [Main]: candidate
        E8.brochette, // SHC, cost 3, [Main]: candidate (boundary)
        E8.molePistol, // SHC, cost 4: too expensive
        E8.barrierBulls, // cost 3 but {Dressrosa}, not SHC
        E8.kingCobra, // SHC, cost 1, only a [Counter]
        C8.robin, // a Straw Hat Crew Character, not an Event
      ],
    });
    activate(g);
    expectOffered(g, 'p1', [E8.concasser, E8.brochette]);
    expect(canFinish(g)).toBe(true);
  });

  it('"up to 1": choosing nothing still pays the DON!! -1 and keeps the hand, trash and the Once Per Turn', () => {
    const g = mine8(SANJI, { hand: [E8.concasser] });
    activate(g);
    act(g, { type: 'done' });
    expect(sortedCards(g, 'p1', 'hand')).toEqual([E8.concasser]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([]);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 9, deck: 1 });
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
  });

  it('a hand with no eligible Event is asked the same way (empty pick, finish only): the prompt does not read the hand', () => {
    const withEvent = mine8(SANJI, { hand: [E8.concasser] });
    const without = mine8(SANJI, { hand: [C8.sai] });
    rawActivate(withEvent, withEvent.leader('p1'));
    rawActivate(without, without.leader('p1'));
    const a = decision(withEvent)!;
    const b = decision(without)!;
    expect([b.kind, b.player, b.purpose, b.prompt]).toEqual([
      a.kind,
      a.player,
      a.purpose,
      a.prompt,
    ]);
    expect(choices(without)).toEqual([]);
    act(without, { type: 'done' });
    expect(donCounts(without, 'p1')).toMatchObject({ active: 9, deck: 1 });
    expect(sortedCards(without, 'p1', 'hand')).toEqual([C8.sai]);
  });

  it('only the [Main] of an Event with [Main] and [Counter] is activated (Fight and Die with Me: Characters with 4000 base power or less +1000; the Leader gets no +3000)', () => {
    const g = mine8(SANJI, { hand: [E8.fightAndDie], characters: [C8.sai, C8.hajrudin] });
    activate(g);
    pickCardId(g, E8.fightAndDie);
    expect(g.power(at(g, 'p1', 'characters', C8.sai))).toBe(5000); // 4000 base +1000
    expect(g.power(at(g, 'p1', 'characters', C8.hajrudin))).toBe(6000); // 6000 base: no bonus
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.fightAndDie]);
  });

  it('a written DON!! cost is still paid: Gum-Gum Lightning returns 2 more DON!! and K.O.s a 6000 Character', () => {
    const g = mine8(SANJI, { hand: [E8.lightning] }, { characters: [C8.hajrudin] });
    activate(g);
    pickCardId(g, E8.lightning);
    // The engine may ask whether to pay the Event's DON!! -2; saying yes is choosing to pay it.
    if (kind(g) === 'optional') yes(g, 'p1');
    if (asksDon(g, 'p1')) {
      pickDonClass(g, 'costActive');
      pickDonClass(g, 'costActive');
    }
    need(g, 'choose', 'p1');
    pickCardId(g, C8.hajrudin);
    expect(sortedCards(g, 'p2', 'characters')).toEqual([]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.lightning]);
    // 10 - 1 (Sanji) - 2 (Lightning) = 7, all still active: the printed cost 2 was not paid.
    expect(donCounts(g, 'p1')).toMatchObject({ active: 7, rested: 0, deck: 3 });
  });

  it('Event DON!! cost that cannot be paid: the Event does not do its effect (no K.O.), whichever way the engine refuses it (M6b-Q92 open)', () => {
    // 2 DON!! on the field: Sanji's cost leaves 1, Lightning needs 2.
    const g = mine8(
      SANJI,
      { hand: [E8.lightning], costArea: { active: 2, rested: 0 } },
      { characters: [C8.hajrudin] },
    );
    activate(g);
    const offered = offeredIds(g);
    if (offered.includes(E8.lightning)) {
      pickCardId(g, E8.lightning);
      // If it was chosen, its cost must be shown as unpayable: accept is not legal.
      if (kind(g) === 'optional') {
        expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        no(g, 'p1');
      }
    } else {
      act(g, { type: 'done' });
    }
    expect(sortedCards(g, 'p2', 'characters')).toEqual([C8.hajrudin]);
    expect(donCounts(g, 'p1').active + donCounts(g, 'p1').rested).toBeGreaterThanOrEqual(1);
  });

  it('a "you may" cost on the activated Event is still the player\'s choice: Meteor-Strike of Love accepted adds a Life card and gives +3000', () => {
    const g = mine8(SANJI, { hand: [E8.meteor], life: [C8.mohji, C8.mohji] });
    activate(g);
    pickCardId(g, E8.meteor);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.life('p1')).toBe(1);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([C8.mohji]);
  });

  it('declining the "you may" cost of the activated Event: no Life is taken and no power is given', () => {
    const g = mine8(SANJI, { hand: [E8.meteor], life: [C8.mohji, C8.mohji] });
    activate(g);
    pickCardId(g, E8.meteor);
    no(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(2);
  });

  it('[Once Per Turn]: not offered again this turn, offered again next turn', () => {
    const g = mine8(SANJI, { hand: [E8.concasser, E8.concasser] });
    activate(g);
    pickCardId(g, E8.concasser);
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, g.leader('p1')).length).toBe(1);
  });

  it('DON!! -1 must be payable: not offered with no DON!! on the field; rested DON!! can pay it', () => {
    const none = mine8(SANJI, { hand: [E8.concasser], costArea: { active: 0, rested: 0 } });
    expect(offeredAbilities(none, none.leader('p1'))).toEqual([]);
    const rested = mine8(SANJI, { hand: [E8.concasser], costArea: { active: 0, rested: 1 } });
    expect(offeredAbilities(rested, rested.leader('p1')).length).toBe(1);
  });
});

describe('OP12-041 Sanji: which DON!! pays the DON!! -1', () => {
  it('with DON!! in two states the player chooses the class: returning a rested one leaves all the active ones', () => {
    const g = mine8(SANJI, { hand: [E8.concasser], costArea: { active: 3, rested: 2 } });
    rawActivate(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(asksDon(g, 'p1')).toBe(true);
    pickDonClass(g, 'costRested');
    need(g, 'choose', 'p1');
    pickCardId(g, E8.concasser);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 3, rested: 1 });
  });
});

describe('OP12-041 Sanji: DON!! -1 from DON!! given to a card', () => {
  it('DON!! given to a Character can pay the DON!! -1 when the cost area is empty', () => {
    const g = mine8(SANJI, {
      hand: [E8.concasser],
      costArea: { active: 0, rested: 0 },
      characters: [{ card: C8.sai, don: 1 }],
    });
    expect(offeredAbilities(g, g.leader('p1')).length).toBe(1);
    activate(g);
    pickCardId(g, E8.concasser);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 0, rested: 0, given: 0 });
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.concasser]);
  });
});

describe("OP12-041 Sanji: [When Attacking] add 1 rested DON!! when the DON!! count is not above the opponent's", () => {
  /** p1 attacks p2's Leader with Sanji; the effect's own count question, if any, is answered with the most. */
  function swing(g: ReturnType<typeof mine8>): void {
    attack(g, g.leader('p1'), g.leader('p2'));
    if (asksCount(g, 'p1')) {
      const d = decision(g)!;
      act(g, { type: 'pick', choice: { option: d.options![0]!.id } });
    }
    expect(['block', 'counter']).toContain(kind(g));
    noDefence(g);
  }

  it('equal counts: adds 1 DON!! from the DON!! deck, rested', () => {
    const g = mine8(
      SANJI,
      { costArea: { active: 5, rested: 0 }, donDeck: 5 },
      {
        costArea: { active: 5, rested: 0 },
      },
    );
    swing(g);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 5, rested: 1, deck: 4 });
  });

  it('fewer DON!! than the opponent: adds 1, rested', () => {
    const g = mine8(
      SANJI,
      { costArea: { active: 3, rested: 0 }, donDeck: 7 },
      {
        costArea: { active: 5, rested: 2 },
      },
    );
    swing(g);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 3, rested: 1, deck: 6 });
  });

  it('one more DON!! than the opponent: nothing is added', () => {
    const g = mine8(
      SANJI,
      { costArea: { active: 6, rested: 0 }, donDeck: 4 },
      {
        costArea: { active: 5, rested: 0 },
      },
    );
    swing(g);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 6, rested: 0, deck: 4 });
  });

  it("DON!! given to a card counts on the field: 4 in the cost area + 1 given = 5 equals the opponent's 5", () => {
    const g = mine8(
      SANJI,
      { costArea: { active: 4, rested: 0 }, characters: [{ card: C8.sai, don: 1 }], donDeck: 5 },
      { costArea: { active: 5, rested: 0 } },
    );
    swing(g);
    expect(donCounts(g, 'p1')).toMatchObject({ rested: 1, deck: 4 });
  });

  it("the opponent's given DON!! count too: 5 in the cost area + 1 given on p2 beats 6 on p1", () => {
    const g = mine8(
      SANJI,
      { costArea: { active: 6, rested: 0 }, donDeck: 4 },
      { costArea: { active: 5, rested: 0 }, characters: [{ card: C8.sai, don: 1 }] },
    );
    swing(g);
    // 6 vs 6: equal, so the effect adds one.
    expect(donCounts(g, 'p1')).toMatchObject({ rested: 1, deck: 3 });
  });

  it('with an empty DON!! deck nothing can be added (and nothing breaks)', () => {
    const g = mine8(
      SANJI,
      { costArea: { active: 10, rested: 0 }, donDeck: 0 },
      {
        costArea: { active: 10, rested: 0 },
      },
    );
    swing(g);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 10, rested: 0, deck: 0 });
  });

  it('only when Sanji attacks: a Character attack does not add DON!!', () => {
    const g = mine8(
      SANJI,
      { costArea: { active: 3, rested: 0 }, characters: [C8.sai], donDeck: 7 },
      {
        costArea: { active: 5, rested: 0 },
      },
    );
    attack(g, at(g, 'p1', 'characters', C8.sai), g.leader('p2'));
    noDefence(g);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });
});
