/** EB04-036 Foxy: [On Play] DON!! -1: with a {Foxy Pirates} Leader draw 2, trash 1, then rest up to 1 opposing Character with cost 9 or less; [Activate: Main] [Once Per Turn] add up to 1 DON!! rested. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  decline,
  don,
  expectDecision,
  hand,
  none,
  payDon,
  pick,
  play,
  V,
} from './helpers.ts';
import {
  BIG12,
  canActivate,
  canPick,
  FOXY_LEADER,
  ids,
  mine,
  OTHER_LEADER,
} from './helpers-eb04g2.ts';

const ID = 'EB04-036';
const COST9 = 'ST04-003';

const setup = (leader: string, theirs: string[] = [COST9, BIG12]) =>
  mine({ leader, hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4] }, { characters: theirs });
const cast = (g: ReturnType<typeof setup>) => {
  play(g, ID);
  accept(g);
  payDon(g);
};

describe('EB04-036 Foxy', () => {
  it('[On Play] DON!! -1, {Foxy Pirates} Leader: draw 2, trash 1, then rest a cost 9 or less Character', () => {
    const g = setup(FOXY_LEADER);
    cast(g);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c1]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', COST9))).toBe(true); // cost 9 is the limit
    expect(canPick(g, g.find('p2', 'characters', BIG12))).toBe(false); // cost 10
    pick(g, [g.find('p2', 'characters', COST9)]);
    expect(g.card(g.find('p2', 'characters', COST9)).rested).toBe(true);
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('"up to 1": may rest nothing', () => {
    const g = setup(FOXY_LEADER);
    cast(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(g.card(g.find('p2', 'characters', COST9)).rested).toBe(false);
  });

  it('without a {Foxy Pirates} Leader the DON!! -1 is paid but nothing is drawn, trashed or rested (the "Then" is inside the guard)', () => {
    const g = setup(OTHER_LEADER);
    cast(g);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(g.card(g.find('p2', 'characters', COST9)).rested).toBe(false);
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('the DON!! -1 can be declined: no draw and no rest', () => {
    const g = setup(FOXY_LEADER);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(0);
  });

  it('[Activate: Main] [Once Per Turn] adds up to 1 DON!! rested; a second use is not offered', () => {
    const g = mine({ leader: OTHER_LEADER, characters: [ID], costArea: { active: 5, rested: 0 } });
    const foxy = g.find('p1', 'characters', ID);
    g.act({ type: 'activate', card: foxy, ability: 'activate' });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 1, deck: 4 });
    expect(canActivate(g, foxy, 'activate')).toBe(false);
  });

  it('[Activate: Main] "up to 1": adding 0 is allowed', () => {
    const g = mine({ leader: OTHER_LEADER, characters: [ID], costArea: { active: 5, rested: 0 } });
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'activate' });
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toContain('0');
  });
});
