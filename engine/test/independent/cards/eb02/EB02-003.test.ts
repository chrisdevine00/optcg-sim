/**
 * EB02-003 Tony Tony.Chopper (Character, Red, cost 3, 3000, Counter +1000, {Animal}/{Straw Hat Crew}/
 * {Drum Kingdom}).
 *
 * Card text: "[DON!! x2] [Opponent's Turn] This Character gains +2000 power.
 * [On Play] If your Leader has the "Straw Hat Crew" type, give up to 1 rested DON!! card to your
 * Leader or 1 of your Characters."
 *
 * Rules: rules-digest 82 (given DON!! add +1000 only on their owner's turn), "[DON!! xN]" needs N
 * given DON!!, "up to" (CR 8-4-4-1). The "If" has no colon: an effect condition.
 */
import { describe, expect, it } from 'vitest';
import {
  canFinish,
  choices,
  choose,
  chooseNone,
  decision,
  donOf,
  E2C,
  E2L,
  kind,
  mine,
  need,
  offers,
  playRaw,
  theirs,
} from './kit-eb02a.ts';

const CHOPPER = 'EB02-003';

/** p1's Main Phase with Chopper in hand; 3 active and 3 rested DON!! in the cost area. */
function inHand(leader: string = E2L.shc, rested = 3) {
  return mine(leader, {
    hand: [CHOPPER],
    costArea: { active: 3, rested },
    characters: [E2C.komachiyo],
  });
}

describe('EB02-003 Chopper: [DON!! x2] [Opponent’s Turn] +2000', () => {
  it('with 2 DON!! given, on the opponent’s turn: 3000 + 2000', () => {
    const g = theirs(E2L.croc, { characters: [{ card: CHOPPER, don: 2 }] });
    expect(g.power(g.find('p1', 'characters', CHOPPER))).toBe(5000);
  });

  it('boundary: with only 1 DON!! given the boost is off (and given DON!! add nothing on the opponent’s turn)', () => {
    const g = theirs(E2L.croc, { characters: [{ card: CHOPPER, don: 1 }] });
    expect(g.power(g.find('p1', 'characters', CHOPPER))).toBe(3000);
  });

  it('3 DON!! given still gives a single +2000', () => {
    const g = theirs(E2L.croc, { characters: [{ card: CHOPPER, don: 3 }] });
    expect(g.power(g.find('p1', 'characters', CHOPPER))).toBe(5000);
  });

  it('does not apply on my own turn: 2 given DON!! give +2000 (DON!!) only', () => {
    const g = mine(E2L.shc, {
      characters: [{ card: CHOPPER, don: 2 }],
      costArea: { active: 8, rested: 0 },
    });
    expect(g.power(g.find('p1', 'characters', CHOPPER))).toBe(5000);
    const h = mine(E2L.shc, { characters: [{ card: CHOPPER, don: 0 }] });
    expect(h.power(h.find('p1', 'characters', CHOPPER))).toBe(3000);
  });
});

describe('EB02-003 Chopper: [On Play] give up to 1 rested DON!! to the Leader or a Character', () => {
  it('with a {Straw Hat Crew} Leader: gives 1 rested DON!! to the Leader', () => {
    const g = inHand();
    const leader = g.leader('p1');
    playRaw(g, CHOPPER);
    expect(kind(g)).toBe('choose');
    expect(offers(g, leader)).toBe(true);
    choose(g, [leader]);
    expect(g.card(leader).don).toBe(1);
    expect(g.power(leader)).toBe(6000);
    need(g, 'main', 'p1');
  });

  it('the target may be one of my Characters (the new Chopper itself included)', () => {
    const g = inHand();
    playRaw(g, CHOPPER);
    const chopper = g.find('p1', 'characters', CHOPPER);
    const komachiyo = g.find('p1', 'characters', E2C.komachiyo);
    expect(offers(g, chopper)).toBe(true);
    expect(offers(g, komachiyo)).toBe(true);
    choose(g, [komachiyo]);
    expect(g.card(komachiyo).don).toBe(1);
    expect(g.card(chopper).don).toBe(0);
  });

  it('only a rested DON!! is given: the cost area loses one rested DON!!', () => {
    const g = inHand();
    playRaw(g, CHOPPER);
    // Chopper cost 3 was paid with active DON!!: 0 active, 3 + 3 rested.
    const before = donOf(g, 'p1');
    expect([before.active, before.rested]).toEqual([0, 6]);
    choose(g, [g.leader('p1')]);
    const after = donOf(g, 'p1');
    expect([after.active, after.rested, after.given]).toEqual([0, 5, 1]);
  });

  it('gives exactly 1 DON!!, not more', () => {
    const g = inHand(E2L.shc, 5);
    playRaw(g, CHOPPER);
    choose(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(donOf(g, 'p1').given).toBe(1);
    need(g, 'main', 'p1');
  });

  it('"up to": the DON!! may be left where it is', () => {
    const g = inHand();
    playRaw(g, CHOPPER);
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('without the {Straw Hat Crew} Leader type nothing is given and no choice is asked', () => {
    const g = inHand(E2L.croc);
    playRaw(g, CHOPPER);
    expect(decision(g)?.kind).toBe('main');
    expect(donOf(g, 'p1').given).toBe(0);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(CHOPPER);
  });

  it('with no rested DON!! (all spent paying the cost) nothing can be given', () => {
    const g = mine(E2L.shc, { hand: [CHOPPER], costArea: { active: 3, rested: 0 } });
    playRaw(g, CHOPPER);
    if (kind(g) === 'choose') {
      expect(choices(g).length).toBeGreaterThanOrEqual(0);
      if (canFinish(g)) chooseNone(g);
    }
    expect(donOf(g, 'p1').given).toBe(0);
  });
});
