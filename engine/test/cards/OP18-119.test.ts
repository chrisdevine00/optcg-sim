/** OP18-119 Saint Shamrock. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { activate, canPick, koBy, offeredAb } from './helpers-w3s.ts';
import { HK1, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-119';
const LEADER = 'OP18-060'; // {Celestial Dragons}{Holy Knights of God}

describe('OP18-119 Saint Shamrock', () => {
  const koed = (handCards: string[]) => {
    const g = game({ leader: LEADER, characters: [ID], hand: handCards }, { leader: PLAIN_BLUE });
    koBy(g, 'p1', ID, 'p2');
    return g;
  };

  it('[On K.O.] trash 1 card from your hand: plays itself from the trash', () => {
    const g = koed([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(zoneOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(zoneOf(g, 'p1', 'trash')).toEqual([BLUE]);
  });

  it('"you may": declining leaves it in the trash and the hand as it was', () => {
    const g = koed([BLUE]);
    decline(g);
    expect(zoneOf(g, 'p1', 'characters')).toEqual([]);
    expect(zoneOf(g, 'p1', 'trash')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = koed([]);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    expect(zoneOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  const played = (trash: string[]) => {
    const g = game(
      { leader: LEADER, hand: [ID], trash, costArea: { active: 8, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    return g;
  };

  it('[Activate: Main] [Once Per Turn] on the turn it was played: plays a {Holy Knights of God} Character with a cost of 6 or less from the trash', () => {
    const g = played([HK1, ID, V.c1]);
    const shamrock = g.find('p1', 'characters', ID);
    expect(offeredAb(g, shamrock, 'play-holy-knight')).toBe(true);
    activate(g, shamrock, 'play-holy-knight');
    expect(canPick(g, g.find('p1', 'trash', HK1))).toBe(true); // cost 8 (another Shamrock) is not offered
    expect(canPick(g, g.find('p1', 'trash', ID))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'trash', HK1)]);
    expect(zoneOf(g, 'p1', 'characters').sort()).toEqual([HK1, ID].sort());
    expect(offeredAb(g, shamrock, 'play-holy-knight')).toBe(false); // once per turn
  });

  it('not played on this turn: the effect does nothing and the Once Per Turn is spent', () => {
    const g = game({ leader: LEADER, characters: [ID], trash: [HK1] }, { leader: PLAIN_BLUE });
    const shamrock = g.find('p1', 'characters', ID);
    activate(g, shamrock, 'play-holy-knight');
    expectDecision(g, 'main', 'p1');
    expect(zoneOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(offeredAb(g, shamrock, 'play-holy-knight')).toBe(false);
  });
});
