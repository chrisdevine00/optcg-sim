/** EB03-017 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, none, option, pick, play, V } from './helpers.ts';
import { canPick, mk, ODEN_L, SN_LEADER } from './helpers-eb03g1.ts';
import { applyOp } from '../../src/testing.ts';

const ID = 'EB03-017';
/** 5 active DON!! pay for Bonney; 2 more are rested. */
const start = (leader: string, rested = 2) =>
  mk(
    { leader, hand: [ID], costArea: { active: 5, rested } },
    { characters: [V.c1, V.c7, V.c6, V.c5, { card: V.c4, rested: true }] },
  );

describe('EB03-017 Jewelry Bonney', () => {
  it('[On Play] with a {Supernovas} Leader: sets up to 1 DON!! as active, then protects an opponent Character with a cost of 8 or less from being rested', () => {
    const g = start(SN_LEADER);
    play(g, ID);
    addMost(g); // set 1 DON!! as active
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 6 });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(true); // cost 7
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    const id = g.find('p2', 'characters', V.c7);
    g.state = applyOp(g.state, { op: 'rest', card: id }).state;
    expect(g.card(id).rested).toBe(false);
    const free = g.find('p2', 'characters', V.c1);
    g.state = applyOp(g.state, { op: 'rest', card: free }).state;
    expect(g.card(free).rested).toBe(true);
  });

  it("the protected Character cannot attack on the opponent's next turn; it ends after their End Phase", () => {
    const g = start(SN_LEADER);
    play(g, ID);
    addMost(g);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    g.act({ type: 'endTurn' });
    const id = g.find('p2', 'characters', V.c6);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === id)).toBe(false);
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p2', 'characters', V.c5)),
    ).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === id)).toBe(true);
  });

  it('must not fire with a Leader that is not {Supernovas}: no DON!! set, no restriction', () => {
    const g = start(ODEN_L);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
  });

  it('"up to 1" DON!!: may set none, and the restriction still follows ("Then" is not "If you do")', () => {
    const g = start(SN_LEADER);
    play(g, ID);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c1)]);
  });

  it('the DON!! rested to pay for Bonney can be the one set as active; the target "up to 1" may be none', () => {
    const g = mk(
      { leader: SN_LEADER, hand: [ID], costArea: { active: 5, rested: 0 } },
      { characters: [V.c1] },
    );
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    none(g);
  });

  it('B4T-R5: the cost bound is 8: a cost-8 Character is a candidate, a cost-9 Character is not', () => {
    const ACCINO = 'EB02-004'; // cost 8, 10000, no effect
    const SHANKS = 'ST16-004'; // cost 9, 11000
    const g = mk(
      { leader: SN_LEADER, hand: [ID], costArea: { active: 5, rested: 2 } },
      { characters: [ACCINO, SHANKS] },
    );
    play(g, ID);
    addMost(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', ACCINO))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', SHANKS))).toBe(false);
  });
});
