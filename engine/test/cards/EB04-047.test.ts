/** EB04-047 Helmeppo: [Activate: Main] you may trash this Character: play up to 1 {SWORD} type Character card with a cost of 3 or less other than [Helmeppo] from your hand or trash. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { canPick, ids, mine, OTHER_LEADER, SWORD1, SWORD4 } from './helpers-eb04g2.ts';

const ID = 'EB04-047';
const HIBARI = 'EB03-008'; // {SWORD} cost 3, unscripted

const setup = (hand: string[], trash: string[]) =>
  mine({ leader: OTHER_LEADER, characters: [ID], hand, trash });
const act = (g: ReturnType<typeof setup>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'activate' });

describe('EB04-047 Helmeppo', () => {
  it('trashes itself and plays a {SWORD} cost 3 or less Character from the hand', () => {
    const g = setup([SWORD1, HIBARI, SWORD4, V.c1], []);
    act(g);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', SWORD1))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', HIBARI))).toBe(true); // cost 3 is the limit
    expect(canPick(g, g.find('p1', 'hand', SWORD4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false); // not {SWORD}
    pick(g, [g.find('p1', 'hand', HIBARI)]);
    expect(ids(g, 'p1', 'characters')).toEqual([HIBARI]);
  });

  it('may play from the trash instead; the hand and the trash are one choice', () => {
    const g = setup([SWORD1], [SWORD1]);
    act(g);
    expect(canPick(g, g.find('p1', 'hand', SWORD1))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', SWORD1))).toBe(true);
    pick(g, [g.find('p1', 'trash', SWORD1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([SWORD1]);
    expect(ids(g, 'p1', 'hand')).toEqual([SWORD1]);
  });

  it('"other than [Helmeppo]": another Helmeppo in hand or trash is not offered', () => {
    const g = setup([ID], [ID]);
    act(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('the Helmeppo trashed as the cost is not a candidate either', () => {
    const g = setup([], []);
    act(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('"up to 1": the cost is paid and nothing is played when none is chosen', () => {
    const g = setup([SWORD1], []);
    act(g);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'hand')).toEqual([SWORD1]);
  });
});
