/** EB02-015 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { C1, C3, C4, canPick, don, expectDecision, mk, pick, V } from './helpers-aeb2g1.ts';
import { dec, none, option, play } from './helpers.ts';

const ID = 'EB02-015';
const start = (p2chars: (string | { card: string; rested: boolean })[]) =>
  mk({ hand: [ID], costArea: { active: 7, rested: 0 } }, { characters: p2chars });
const restedC3 = { card: C3, rested: true };
const restedC4 = { card: C4, rested: true };

describe('EB02-015 Jewelry Bonney', () => {
  it('[On Play]: the chosen rested opposing Character does not become active in their next Refresh Phase; the other one does', () => {
    const g = start([restedC3, restedC4, C1]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', C3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', C4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', C1))).toBe(false); // active: not offered
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'characters', C3)]);
    expectDecision(g, 'main', 'p1');
    g.act({ type: 'endTurn' });
    option(g, '1'); // the end-of-turn DON!! count (see below)
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', C3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', C4)).rested).toBe(false);
  });

  it('it is the next Refresh Phase only: the Character is active after the one after', () => {
    const g = start([restedC3]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', C3)]);
    g.act({ type: 'endTurn' });
    option(g, '1');
    g.act({ type: 'endTurn' }); // p2 ends; p1's turn
    g.act({ type: 'endTurn' }); // p1 ends (no more [Bonney] effects)
    expect(g.card(g.find('p2', 'characters', C3)).rested).toBe(false);
  });

  it('sets up to 1 DON!! active at the end of this turn (not before)', () => {
    const g = start([restedC3]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', C3)]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 }); // still all rested this turn
    g.act({ type: 'endTurn' });
    expect(dec(g)?.max).toBe(1);
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 6 });
  });

  it('"up to 1": the Character may be left alone and the DON!! count may be 0', () => {
    const g = start([restedC3]);
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    expect(g.card(g.find('p2', 'characters', C3)).rested).toBe(false); // refreshed normally
  });

  it('with no rested opposing Character the DON!! is still set active (the two halves are independent)', () => {
    const g = start([C1, V.c2]);
    play(g, ID);
    expectDecision(g, 'main', 'p1'); // nothing to choose: no prompt
    g.act({ type: 'endTurn' });
    option(g, '1');
    expect(don(g, 'p1').active).toBe(1);
  });
});
