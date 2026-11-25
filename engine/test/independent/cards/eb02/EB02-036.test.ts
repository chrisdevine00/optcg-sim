/**
 * EB02-036 Nico Robin (Character, Purple, cost 3, 2000, Counter +1000, {Straw Hat Crew}, [Blocker]).
 *
 * Card text: "[Blocker]
 * [On K.O.] DON!! −1: Look at 3 cards from the top of your deck; reveal up to 1 "Straw Hat Crew"
 * type card and add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: [Blocker] (CR 10-1-3); [On K.O.] (rules-digest 110); DON!! −N is an optional cost
 * (returned to the DON!! deck); "up to" (CR 8-4-4-1/-2). A "type card" may be of any category.
 * Scenery: Sanji OP04-007 (cost 1, {Straw Hat Crew}), Usopp OP09-063 (cost 4, {Straw Hat Crew}),
 * OP10-061 (Event, {Straw Hat Crew}/{Dressrosa}), Mohji (no such type).
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  blockers,
  canFinish,
  choices,
  choose,
  chooseNone,
  decision,
  deck,
  donOf,
  driveLookPlay,
  E2C,
  E2L,
  fill,
  hand,
  kind,
  kw,
  need,
  offered,
  passBlock,
  passCounter,
  skipUnusable,
  tail,
  theirs,
  accept,
  decline,
  payDon,
} from './kit-eb02a.ts';

const ROBIN = 'EB02-036';
const EVENT_SHC = 'OP10-061';
const FILL = E2C.mohji;

/** p1 defends: its Robin is rested (so it can be attacked); p2's Marco (5000) attacks it. */
function koed(top: string[], costArea = { active: 3, rested: 0 }) {
  const g = theirs(
    E2L.croc,
    {
      characters: [{ card: ROBIN, rested: true }],
      deck: [...top, ...fill(FILL, 10)],
      costArea,
    },
    { characters: [E2C.marco] },
  );
  attack(g, g.find('p2', 'characters', E2C.marco), g.find('p1', 'characters', ROBIN));
  passBlock(g);
  passCounter(g);
  return g;
}

describe('EB02-036 Nico Robin: [Blocker]', () => {
  it('has [Blocker] and may block an attack on my Leader', () => {
    const g = theirs(E2L.croc, { characters: [ROBIN] });
    expect(kw(g, g.find('p1', 'characters', ROBIN))).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(decision(g)?.kind).toBe('block');
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ROBIN)]);
  });

  it('surviving a block (a 1000-power attacker against 2000) does not trigger [On K.O.]', () => {
    const g = theirs(
      E2L.croc,
      { characters: [ROBIN], costArea: { active: 3, rested: 0 } },
      { characters: [E2C.gaimon] },
    );
    attack(g, g.find('p2', 'characters', E2C.gaimon), g.leader('p1'));
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ROBIN) });
    passCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ROBIN]);
    expect(decision(g)?.kind).not.toBe('optional');
    expect(donOf(g, 'p1').active).toBe(3);
  });
});

describe('EB02-036 Nico Robin: [On K.O.] DON!! −1: look at 3, add up to 1 {Straw Hat Crew} card', () => {
  it('when K.O.’d: pay DON!! −1, then offered exactly the {Straw Hat Crew} cards of the top 3', () => {
    const g = koed([E2C.shc1, E2C.mohji, EVENT_SHC]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costActive');
    const names = choices(g)
      .map((i) => g.card(i).card)
      .sort();
    expect(names).toEqual([E2C.shc1, EVENT_SHC].sort());
  });

  it('the cost returns 1 DON!! to the DON!! deck', () => {
    const g = koed([E2C.shc1, E2C.mohji, EVENT_SHC]);
    const before = donOf(g, 'p1');
    accept(g);
    payDon(g, 1, 'costActive');
    const after = donOf(g, 'p1');
    expect(before.active + before.rested - (after.active + after.rested)).toBe(1);
    expect(after.deck - before.deck).toBe(1);
  });

  it('the chosen card goes to hand and the other 2 to the bottom of the deck', () => {
    const g = koed([E2C.shc1, E2C.mohji, EVENT_SHC]);
    accept(g);
    payDon(g, 1, 'costActive');
    driveLookPlay(g, [E2C.shc1], []);
    expect(hand(g)).toEqual([E2C.shc1]);
    expect(deck(g)).toHaveLength(12);
    expect(deck(g)[0]).toBe(FILL);
    expect(tail(deck(g), 2)).toEqual([E2C.mohji, EVENT_SHC].sort());
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ROBIN);
  });

  it('"up to 1": adding nothing puts all 3 at the bottom', () => {
    const g = koed([E2C.shc1, E2C.mohji, EVENT_SHC]);
    accept(g);
    payDon(g, 1, 'costActive');
    expect(canFinish(g)).toBe(true);
    driveLookPlay(g, [], []);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 3)).toEqual([E2C.shc1, E2C.mohji, EVENT_SHC].sort());
  });

  it('only the top 3 are looked at: a {Straw Hat Crew} card in 4th place is not offered', () => {
    const g = koed([E2C.mohji, E2C.mohji, E2C.mohji, E2C.shc1]);
    accept(g);
    payDon(g, 1, 'costActive');
    expect(kind(g) === 'choose' ? choices(g) : []).toEqual([]);
    driveLookPlay(g, [], []);
    expect(deck(g)[0]).toBe(E2C.shc1);
  });

  it('adds at most one when two {Straw Hat Crew} cards are in the top 3', () => {
    const g = koed([E2C.shc1, E2C.shc4, EVENT_SHC]);
    accept(g);
    payDon(g, 1, 'costActive');
    choose(g, [choices(g).find((i) => g.card(i).card === E2C.shc4)!]);
    expect(hand(g)).toEqual([E2C.shc4]);
    expect(kind(g)).not.toBe('choose');
  });

  it('the DON!! cost is optional: declining it adds nothing and returns no DON!!', () => {
    const g = koed([E2C.shc1, E2C.mohji, EVENT_SHC]);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(donOf(g, 'p1').active).toBe(3);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    need(g, 'main', 'p2');
  });

  it('with no DON!! on my field the cost cannot be paid: the effect is not used', () => {
    const g = koed([E2C.shc1, E2C.mohji, EVENT_SHC], { active: 0, rested: 0 });
    skipUnusable(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    need(g, 'main', 'p2');
  });

  it('a rested DON!! can pay the cost too', () => {
    const g = koed([E2C.shc1, E2C.mohji, EVENT_SHC], { active: 0, rested: 2 });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costRested');
    expect(donOf(g, 'p1').rested).toBe(1);
    expect(choices(g).length).toBeGreaterThan(0);
    chooseNone(g);
  });
});
