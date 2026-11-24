/** EB04-039 Eustass"Captain"Kid: [On Play] add up to 1 DON!! active; [Activate: Main] trash this Character: play up to 1 {Kid Pirates} Character with cost 5 or less from your hand. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, none, pick, play, V } from './helpers.ts';
import { canActivate, canPick, ids, KID2, KID7, mine, OTHER_LEADER } from './helpers-eb04g2.ts';

const ID = 'EB04-039';
const KID5 = 'ST10-007';

const withKid = (hand: string[]) =>
  mine({ leader: OTHER_LEADER, characters: [ID], hand, costArea: { active: 5, rested: 0 } });
const act = (g: ReturnType<typeof withKid>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'activate' });

describe('EB04-039 Eustass"Captain"Kid', () => {
  it('[On Play] adds up to 1 DON!! from the DON!! deck, active', () => {
    const g = mine({ leader: OTHER_LEADER, hand: [ID], costArea: { active: 7, rested: 0 } });
    play(g, ID);
    addMost(g);
    // 7 active, 7 paid (rested), 1 added active
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 7, deck: 2 });
  });

  it('[On Play] "up to 1": adding 0 is allowed', () => {
    const g = mine({ leader: OTHER_LEADER, hand: [ID], costArea: { active: 7, rested: 0 } });
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toContain('0');
  });

  it('[Activate: Main] trashes itself and plays a {Kid Pirates} cost 5 Character from hand; cost 7 and other types are not offered', () => {
    const g = withKid([KID5, KID7, V.c3, KID2]);
    act(g);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', KID5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', KID2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', KID7))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'hand', KID5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([KID5]);
    expect(ids(g, 'p1', 'hand').sort()).toEqual([KID7, V.c3, KID2].sort());
  });

  it('the Character is played active (not rested) and costs nothing', () => {
    const g = withKid([KID2]);
    act(g);
    pick(g, [g.find('p1', 'hand', KID2)]);
    expect(g.card(g.find('p1', 'characters', KID2)).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0 });
  });

  it('"up to 1": the cost is paid and nothing is played when none is chosen', () => {
    const g = withKid([KID2]);
    act(g);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('with no {Kid Pirates} Character in hand it may still be activated; the hand pick is asked at max 0 (hidden zone, not gated)', () => {
    const g = withKid([V.c3]);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
    act(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });
});
