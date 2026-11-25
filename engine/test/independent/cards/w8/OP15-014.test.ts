/**
 * OP15-014 Bartolomeo (Character, Red, cost 4, 6000, {Dressrosa}/{Barto Club}).
 *
 * Card text: "If this Character would be K.O.'d, you may trash 1 Event from your hand instead.
 * [On Play] Activate up to 1 {Dressrosa} type Event with a base cost of 3 or less from your hand."
 *
 * Rules used: a replacement effect with "you may" is the controller's choice (CR 10-3); K.O. only,
 * not other removal; the Event for the [On Play] is activated without paying its printed cost, with
 * its written cost paid, only its [Main], and is trashed afterwards (official OP12-041 / OP15-046
 * Q&A, M6b-Q27); "base cost" is the printed cost; the "up to 1" pick over the hand is asked even
 * when nothing matches and the replacement question never depends on the hidden hand (conventions
 * for hidden cards, M6b-Q93, ADR 0005). M6b-Q92 (unpayable own cost) is open: only outcomes every
 * reading shares are asserted.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  C8,
  canFinish,
  choices,
  decision,
  donCounts,
  E8,
  expectOffered,
  kind,
  L8,
  mine8,
  need,
  no,
  noDefence,
  none,
  offeredIds,
  pickCardId,
  sortedCards,
  theirs8,
  yes,
} from './kit-w8a.ts';

const BARTO = 'OP15-014';
const RASHOMON = 'OP12-038'; // Green Event, cost 1, {Straw Hat Crew}: [Main] You may rest 2 DON!!: K.O. up to 2 rested Characters with a base cost of 4 or less.
const BARRIER_PISTOL = E8.barrierPistol;

function play(g: ReturnType<typeof mine8>): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', BARTO) });
}

/** p2's Kingdew (7000) attacks the rested Bartolomeo; p1 does not block or counter. Stops at the first question. */
function kingdewAttacks(hand: string[]) {
  const g = theirs8(
    L8.luffy,
    { hand, characters: [{ card: BARTO, rested: true }] },
    { characters: [C8.kingdew] },
  );
  attack(g, at(g, 'p2', 'characters', C8.kingdew), at(g, 'p1', 'characters', BARTO));
  noDefence(g);
  return g;
}

describe('OP15-014 Bartolomeo: [On Play] activate a {Dressrosa} Event with base cost 3 or less from hand', () => {
  it('printed values: Character, cost 4, 6000 power', () => {
    const g = mine8(L8.rebecca, { hand: [BARTO] });
    const b = g.zone('p1', 'hand')[0]!;
    expect(g.card(b.instance).cost).toBe(4);
    act(g, { type: 'playCard', card: b.instance });
    expect(g.power(at(g, 'p1', 'characters', BARTO))).toBe(6000);
  });

  it('candidates: {Dressrosa} Events with base cost 3 or less (cost 3 and 1 both count); cost 4, 5, a non-Dressrosa Event and a Character do not', () => {
    const g = mine8(L8.rebecca, {
      hand: [
        BARTO,
        E8.barrierBulls, // Dressrosa, cost 3
        E8.aceDeserved, // Dressrosa, cost 1
        E8.bagworm, // {Straw Hat Crew}/{Dressrosa}, cost 3
        E8.radioKnife, // Dressrosa, cost 4
        E8.barrierPistol, // Dressrosa, cost 5
        E8.concasser, // not Dressrosa
        C8.shinobu, // a Character
      ],
    });
    play(g);
    expectOffered(g, 'p1', [E8.barrierBulls, E8.aceDeserved, E8.bagworm]);
    expect(canFinish(g)).toBe(true);
  });

  it('"base cost": a cost-4 Event that costs 1 in the hand (Just Watch Me, Ace!!! with 4 Events in the trash) is still not a candidate', () => {
    const g = mine8(L8.rebecca, {
      hand: [BARTO, E8.justWatch, E8.barrierBulls],
      trash: [E8.concasser, E8.concasser, E8.concasser, E8.concasser],
    });
    play(g);
    expectOffered(g, 'p1', [E8.barrierBulls]);
  });

  it('activates the Event for free: Barrier Bulls draws 1 and gives the Leader +1000; the Event is trashed; only the 4 DON!! of Bartolomeo are paid', () => {
    const g = mine8(L8.rebecca, { hand: [BARTO, E8.barrierBulls, C8.sai] });
    play(g);
    pickCardId(g, E8.barrierBulls);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.barrierBulls]);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([C8.mohji, C8.sai].sort());
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
    expect(g.eventsOfType('EventActivated').length).toBe(1);
  });

  it('"up to 1": choosing nothing activates nothing and keeps every card in hand', () => {
    const g = mine8(L8.rebecca, { hand: [BARTO, E8.barrierBulls] });
    play(g);
    none(g);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([E8.barrierBulls]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no eligible Event the "up to 1" question is still asked, with nothing to choose (the hand is not revealed by the prompt)', () => {
    const withEvent = mine8(L8.rebecca, { hand: [BARTO, E8.barrierBulls] });
    const without = mine8(L8.rebecca, { hand: [BARTO, C8.sai] });
    play(withEvent);
    play(without);
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
    expect(kind(without)).toBe('main');
  });

  it('an Event with a written "you may" cost is activated and the cost is still chosen: Ace Here Said You Deserved It!! rests 4 DON!!, -3000 and K.O.s a 3000-power Character', () => {
    const g = mine8(L8.rebecca, { hand: [BARTO, E8.aceDeserved] }, { characters: [C8.mohji] });
    play(g);
    pickCardId(g, E8.aceDeserved);
    yes(g, 'p1');
    // The effect's own targets: answer by taking the first offered pick until the Main Phase returns.
    for (let i = 0; i < 6 && kind(g) === 'choose'; i++) {
      const p = g.legal().find((a) => a.type === 'pick');
      if (p) g.act(p);
      else act(g, { type: 'done' });
    }
    expect(sortedCards(g, 'p2', 'characters')).toEqual([]);
    expect(donCounts(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.aceDeserved]);
  });

  it("an activated Event whose written cost cannot be paid does not do its effect (4 DON!! cannot be rested after Bartolomeo's cost; M6b-Q92 open)", () => {
    const g = mine8(
      L8.rebecca,
      { hand: [BARTO, E8.aceDeserved], costArea: { active: 6, rested: 0 } },
      { characters: [C8.mohji] },
    );
    play(g);
    if (offeredIds(g).includes(E8.aceDeserved)) {
      pickCardId(g, E8.aceDeserved);
      if (kind(g) === 'optional') {
        expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        no(g, 'p1');
      }
    } else {
      none(g);
    }
    expect(sortedCards(g, 'p2', 'characters')).toEqual([C8.mohji]);
    expect(donCounts(g, 'p1').rested).toBe(4);
  });
});

describe("OP15-014 Bartolomeo: if K.O.'d, you may trash 1 Event from your hand instead", () => {
  it('K.O. in battle, accepted: the Event is trashed from the hand, Bartolomeo stays on the field and no K.O. happens', () => {
    const g = kingdewAttacks([E8.concasser, C8.sai]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'choose') pickCardId(g, E8.concasser);
    expect(sortedCards(g, 'p1', 'characters')).toEqual([BARTO]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.concasser]);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([C8.sai]);
    expect(g.eventsOfType('CardKOd').length).toBe(0);
    expect(sortedCards(g, 'p2', 'characters')).toEqual([C8.kingdew]);
  });

  it("declined: Bartolomeo is K.O.'d and the Event stays in the hand", () => {
    const g = kingdewAttacks([E8.concasser]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(sortedCards(g, 'p1', 'characters')).toEqual([]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([BARTO]);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([E8.concasser]);
  });

  it('only an Event can be trashed: with Events and Characters in hand, only the Events are offered, and the chosen one goes', () => {
    const g = kingdewAttacks([E8.concasser, E8.barrierBulls, C8.sai]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(
      choices(g)
        .map((i) => g.card(i).card)
        .sort(),
    ).toEqual([E8.concasser, E8.barrierBulls].sort());
    pickCardId(g, E8.barrierBulls);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.barrierBulls]);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([E8.concasser, C8.sai].sort());
    expect(sortedCards(g, 'p1', 'characters')).toEqual([BARTO]);
  });

  it('the question is asked the same way with and without an Event in hand (the opponent cannot tell); without one, "use" is not available and Bartolomeo is K.O.\'d', () => {
    const withEvent = kingdewAttacks([E8.concasser]);
    const without = kingdewAttacks([C8.sai]);
    const empty = kingdewAttacks([]);
    for (const g of [withEvent, without, empty]) {
      const d = decision(g)!;
      expect([d.kind, d.player, d.purpose, d.prompt]).toEqual([
        'optional',
        'p1',
        'replacement',
        "Use Bartolomeo's effect instead of the K.O. of Bartolomeo?",
      ]);
    }
    for (const g of [without, empty]) {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
      expect(sortedCards(g, 'p1', 'characters')).toEqual([]);
      expect(sortedCards(g, 'p1', 'trash')).toEqual([BARTO]);
    }
    expect(withEvent.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
  });

  it('a K.O. by an effect is replaced too (Two-Sword Style Rashomon K.O.s the rested Bartolomeo, base cost 4): accepted, it stays', () => {
    const g = theirs8(
      L8.luffy,
      { hand: [E8.concasser], characters: [{ card: BARTO, rested: true }] },
      { hand: [RASHOMON] },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', RASHOMON) });
    // p2: pay the "you may rest 2 DON!!" cost and pick Bartolomeo as one of up to 2 targets.
    for (let i = 0; i < 8 && decision(g)?.player === 'p2'; i++) {
      const d = decision(g)!;
      if (d.kind === 'optional') yes(g, 'p2');
      else if (d.kind === 'choose') {
        const p = g.legal().find((a) => a.type === 'pick' && typeof a.choice === 'string');
        if (p) g.act(p);
        else act(g, { type: 'done' });
      } else break;
    }
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'choose') pickCardId(g, E8.concasser);
    expect(sortedCards(g, 'p1', 'characters')).toEqual([BARTO]);
    expect(sortedCards(g, 'p1', 'trash')).toEqual([E8.concasser]);
  });

  it('only K.O.: being placed at the bottom of the deck by an effect (Barrier-Barrier Pistol) asks nothing and loses Bartolomeo', () => {
    const g = theirs8(
      L8.luffy,
      { hand: [E8.concasser], characters: [BARTO] },
      { hand: [BARRIER_PISTOL] },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', BARRIER_PISTOL) });
    for (let i = 0; i < 6 && decision(g)?.player === 'p2' && kind(g) !== 'main'; i++) {
      const p = g.legal().find((a) => a.type === 'pick' && typeof a.choice === 'string');
      if (p) g.act(p);
      else act(g, { type: 'done' });
    }
    expect(decision(g)?.player).toBe('p2');
    expect(kind(g)).toBe('main');
    expect(sortedCards(g, 'p1', 'characters')).toEqual([]);
    expect(sortedCards(g, 'p1', 'hand')).toEqual([E8.concasser]);
  });
});
