/**
 * EB02-016 Chopperman (Character, Green, cost 5, 6000, Counter +1000, {Animal}/{Straw Hat Crew}).
 *
 * Card text: "Also treat this card's name as [Tony Tony.Chopper] according to the rules.
 * [On Play] Play up to 1 "Animal" type Character card with a cost of 3 or less from your hand."
 *
 * Rules: "treat this card's name as" (CR 10-? name aliasing), "up to" (CR 8-4-4-1). The name alias is
 * observed through OP08-016 Dr.Hiriluk ("[Activate: Main] You may rest this Character: If your Leader
 * is [Tony Tony.Chopper], all of your [Tony Tony.Chopper] Characters gain +2000 power during this
 * turn", cost 3, 0 power) with the Leader OP08-001 Tony Tony.Chopper.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activate,
  canFinish,
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
} from './kit-eb02a.ts';

const CHOPPERMAN = 'EB02-016';
/** ST08-012 Laboon: cost 4, 6000, {Animal}, vanilla. */
const LABOON = 'ST08-012';
/** OP08-039 Zou: Stage, cost 3, {Animal}. */
const ZOU = 'OP08-039';

function start(handExtra: string[]) {
  const g = mine(E2L.shc, { hand: [CHOPPERMAN, ...handExtra] });
  playRaw(g, CHOPPERMAN);
  return g;
}

describe('EB02-016 Chopperman: [On Play] play up to 1 {Animal} Character with cost 3 or less from hand', () => {
  it('plays an {Animal} Character of cost 3 for free', () => {
    const g = start([E2C.ryu]);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'hand', E2C.ryu)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([CHOPPERMAN, E2C.ryu].sort());
    expect(donOf(g, 'p1').active).toBe(5);
    need(g, 'main', 'p1');
  });

  it('the cost boundary: cost 3 and cost 2 are offered, cost 4 and cost 5 are not', () => {
    const g = start([E2C.ryu, E2C.momoo, LABOON, E2C.karoo5]);
    expect(offers(g, g.find('p1', 'hand', E2C.ryu))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', E2C.momoo))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', LABOON))).toBe(false);
    expect(offers(g, g.find('p1', 'hand', E2C.karoo5))).toBe(false);
  });

  it('a non-{Animal} Character of low cost is not offered', () => {
    const g = start([E2C.ryu, E2C.mohji, E2C.marco]);
    expect(offers(g, g.find('p1', 'hand', E2C.mohji))).toBe(false);
    expect(offers(g, g.find('p1', 'hand', E2C.marco))).toBe(false);
  });

  it('only a Character card: an {Animal} Stage of cost 3 is not offered', () => {
    const g = start([E2C.ryu, ZOU]);
    expect(offers(g, g.find('p1', 'hand', ZOU))).toBe(false);
    expect(offers(g, g.find('p1', 'hand', E2C.ryu))).toBe(true);
  });

  it('"up to 1": the {Animal} Character may stay in hand', () => {
    const g = start([E2C.ryu]);
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([E2C.ryu]);
  });

  it('plays only one even with two eligible cards in hand', () => {
    const g = start([E2C.ryu, E2C.momoo]);
    choose(g, [g.find('p1', 'hand', E2C.ryu)]);
    need(g, 'main', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([E2C.momoo]);
  });

  it('the pick is asked even when nothing in hand qualifies (no prompt depends on the hidden hand)', () => {
    const g = mine(E2L.shc, { hand: [CHOPPERMAN, E2C.mohji] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', CHOPPERMAN) });
    for (let i = 0; i < 6 && decision(g)?.purpose === 'cost'; i++) {
      const pay = g.legal().find((a) => a.type === 'pick');
      if (!pay) break;
      g.act(pay);
    }
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(d?.max).toBe(0);
  });

  it('its name counts as [Tony Tony.Chopper]: OP15-085 Chopper cannot fetch it from the trash ("other than [Tony Tony.Chopper]")', () => {
    const g = mine(E2L.shc, {
      characters: ['OP15-085'],
      trash: [CHOPPERMAN, E2C.shc4],
    });
    activate(g, g.find('p1', 'characters', 'OP15-085'));
    expect(kind(g)).toBe('choose');
    expect(offers(g, g.find('p1', 'trash', E2C.shc4))).toBe(true);
    expect(offers(g, g.find('p1', 'trash', CHOPPERMAN))).toBe(false);
  });
});
