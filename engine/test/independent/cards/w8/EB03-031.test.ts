/**
 * EB03-031 Vinsmoke Reiju (Character, Purple, cost 5, 5000, Counter +1000, {The Vinsmoke Family}/
 * {GERMA 66}).
 *
 * Card text: "[Your Turn] [On Play] DON!! -1: If your Leader is [Sanji], activate the [Main] effect of
 * up to 1 Event card with a cost of 7 or less in your trash."
 *
 * Rules used: the DON!! -1 cost is paid when the effect is used (it may be declined, M-lessons of
 * the leftovers batch) and an "If" after the colon is an effect condition, so the cost is paid even
 * when the Leader is not [Sanji]; the [Main] of an Event in the trash is activated, the card stays
 * in the trash and is not "activated" as an Event: official EB03-031 Q&A (M6b-Q27, M6b-Q28); a
 * written cost of that [Main] is paid; "cost of 7 or less" is the printed cost; "up to 1" is asked
 * over the (public) trash. The [Your Turn] restriction cannot be reached from a position here: the
 * card is only played on its owner's turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  asksDon,
  C8,
  canFinish,
  choices,
  donCounts,
  E8,
  expectOffered,
  kind,
  L8,
  mine8,
  need,
  no,
  none,
  pickCardId,
  pickDonClass,
  sortedCards,
  yes,
  decision,
} from './kit-w8a.ts';

const REIJU = 'EB03-031';

/** Play Reiju with a raw action; the 5 DON!! of its cost are paid without a choice when all are active. */
function playReiju(g: ReturnType<typeof mine8>): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', REIJU) });
}

/** Pay any DON!! class picks p1 is asked for (a cost spread over active and rested DON!!). */
function payAnyDon(g: ReturnType<typeof mine8>): void {
  for (let i = 0; i < 6 && asksDon(g, 'p1'); i++) pickDonClass(g, 'costActive');
}

/** Reiju played, DON!! -1 accepted and paid; the "up to 1 Event in the trash" pick is pending. */
function toTrashPick(g: ReturnType<typeof mine8>): void {
  playReiju(g);
  need(g, 'optional', 'p1');
  yes(g, 'p1');
  payAnyDon(g);
  need(g, 'choose', 'p1');
}

const TRASH_MIX = [
  E8.concasser, // SHC, cost 1, [Main]: candidate
  E8.lightning, // cost 2, [Main] DON!! -2: candidate
  E8.fireFist, // cost 7, [Main]: candidate (boundary)
  E8.zehahaha, // cost 8: not a candidate
  E8.whitebeardKing, // cost 9: not a candidate
  E8.kingCobra, // cost 1 but only a [Counter]
  C8.sai, // a Character
];

describe('EB03-031 Vinsmoke Reiju: [On Play] DON!! -1: with a [Sanji] Leader activate the [Main] of an Event (cost 7 or less) in the trash', () => {
  it('printed values: Character, cost 5, 5000 power, Counter +1000', () => {
    const g = mine8(L8.sanji, { hand: [REIJU] });
    const r = g.card(g.find('p1', 'hand', REIJU));
    expect(r.cost).toBe(5);
    expect(r.counter).toBe(1000);
    playReiju(g);
    expect(g.power(g.find('p1', 'characters', REIJU))).toBe(5000);
  });

  it('candidates: Events with a printed cost of 7 or less that have a [Main] (cost 1, 2 and 7); cost 8 and 9, a [Counter]-only Event and a Character are not', () => {
    const g = mine8(L8.sanji, { hand: [REIJU], trash: TRASH_MIX });
    toTrashPick(g);
    expectOffered(g, 'p1', [E8.concasser, E8.lightning, E8.fireFist]);
    expect(canFinish(g)).toBe(true);
  });

  it('activates the [Main]: Concasser draws 1 for a [Sanji] Leader; the card stays in the trash; the DON!! -1 is paid (9 DON!! left on the field)', () => {
    const g = mine8(L8.sanji, { hand: [REIJU], trash: [E8.concasser] });
    toTrashPick(g);
    pickCardId(g, E8.concasser);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([C8.mohji]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.concasser]);
    const d = donCounts(g, 'p1');
    expect(d.active + d.rested).toBe(9);
    expect(d.deck).toBe(1);
  });

  it('only the [Main] is used: the [Counter] of Concasser (Leader +4000 with 4 Events in the trash) does nothing', () => {
    const g = mine8(L8.sanji, {
      hand: [REIJU],
      trash: [E8.concasser, E8.lightning, E8.lightning, E8.lightning],
    });
    toTrashPick(g);
    pickCardId(g, E8.concasser);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sortedCards(g, 'p1', 'trash')).toHaveLength(4);
  });

  it('the Event is not "activated" as an Event (no EventActivated), because only its [Main] effect is activated (Q&A: Page One cannot respond)', () => {
    const g = mine8(L8.sanji, { hand: [REIJU], trash: [E8.concasser] });
    toTrashPick(g);
    pickCardId(g, E8.concasser);
    expect(g.eventsOfType('EventActivated').length).toBe(0);
  });

  it('a written cost of that [Main] is paid too: Gum-Gum Lightning returns 2 more DON!! and K.O.s a 6000-power Character; the card stays in the trash', () => {
    const g = mine8(
      L8.sanji,
      { hand: [REIJU], trash: [E8.lightning] },
      { characters: [C8.hajrudin] },
    );
    toTrashPick(g);
    pickCardId(g, E8.lightning);
    if (kind(g) === 'optional') yes(g, 'p1');
    payAnyDon(g);
    need(g, 'choose', 'p1');
    pickCardId(g, C8.hajrudin);
    expect(sortedCards(g, 'p2', 'characters')).toEqual([]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.lightning]);
    const d = donCounts(g, 'p1');
    expect(d.active + d.rested).toBe(7); // 10 - 1 (Reiju) - 2 (Lightning)
  });

  it("the [Main]'s DON!! cost is paid out of what is left: with exactly 5 DON!! (all rested by Reiju) Lightning's DON!! -2 still works and leaves 2", () => {
    const g = mine8(
      L8.sanji,
      { hand: [REIJU], trash: [E8.lightning], costArea: { active: 5, rested: 0 } },
      { characters: [C8.hajrudin] },
    );
    toTrashPick(g);
    pickCardId(g, E8.lightning);
    if (kind(g) === 'optional') yes(g, 'p1');
    payAnyDon(g);
    need(g, 'choose', 'p1');
    pickCardId(g, C8.hajrudin);
    expect(sortedCards(g, 'p2', 'characters')).toEqual([]);
    const d = donCounts(g, 'p1');
    expect(d.active + d.rested).toBe(2);
  });

  it("rested DON!! can pay the DON!! -1 (all 5 DON!! rested by Reiju's own cost)", () => {
    const g = mine8(L8.sanji, {
      hand: [REIJU],
      trash: [E8.concasser],
      costArea: { active: 5, rested: 0 },
    });
    toTrashPick(g);
    const d = donCounts(g, 'p1');
    expect(d.active + d.rested).toBe(4);
    expect(d.deck).toBe(6); // 5 were in the DON!! deck, one came back
  });

  it('an Event with a "you may" cost in its [Main] keeps its choice: Meteor-Strike of Love from the trash, accepted, takes a Life card and gives +3000; the card stays in the trash', () => {
    const g = mine8(L8.sanji, { hand: [REIJU], trash: [E8.meteor], life: [C8.mohji, C8.mohji] });
    toTrashPick(g);
    pickCardId(g, E8.meteor);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickCardId(g, L8.sanji);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.life('p1')).toBe(1);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.meteor]);
  });

  it('another [Sanji] Leader counts by name (the Red PRB01-001 Sanji)', () => {
    const g = mine8(L8.sanjiRed, { hand: [REIJU], trash: [E8.concasser] });
    toTrashPick(g);
    pickCardId(g, E8.concasser);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([C8.mohji]);
  });

  it('with a Leader that is not [Sanji] the cost is still paid (the "If" is an effect condition) but no Event is activated: nothing is drawn and the trash is unchanged', () => {
    const g = mine8(L8.shanks, { hand: [REIJU], trash: [E8.concasser] });
    playReiju(g);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payAnyDon(g);
    expect(kind(g)).toBe('main');
    expect(donCounts(g, 'p1').deck).toBe(1);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.concasser]);
    expect(g.eventsOfType('EventActivated').length).toBe(0);
  });

  it('declining the DON!! -1 uses nothing: no DON!! returned and no Event picked', () => {
    const g = mine8(L8.sanji, { hand: [REIJU], trash: [E8.concasser] });
    playReiju(g);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(donCounts(g, 'p1')).toMatchObject({ deck: 0 });
    expect(sortedCards(g, 'p1', 'hand')).toEqual([]);
  });

  it('"up to 1": choosing nothing activates nothing (the DON!! -1 is already paid)', () => {
    const g = mine8(L8.sanji, { hand: [REIJU], trash: [E8.concasser] });
    toTrashPick(g);
    none(g);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([]);
    expect(donCounts(g, 'p1').deck).toBe(1);
    expect(kind(g)).toBe('main');
  });

  it('with no Event in the trash the pick is still asked with nothing to choose, and only an Event with cost 7 or less is ever offered', () => {
    const g = mine8(L8.sanji, { hand: [REIJU], trash: [E8.zehahaha, C8.sai] });
    playReiju(g);
    yes(g, 'p1');
    payAnyDon(g);
    const d = decision(g)!;
    expect(d.kind === 'choose' || d.kind === 'main').toBe(true);
    if (d.kind === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(sortedCards(g, 'p1', 'trash')).toEqual([C8.sai, E8.zehahaha].sort());
  });
});
