/** OP09-029 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { canPick, mk, mkOdyssey, ODY, rested } from './helpers-a09g1.ts';

const ID = 'OP09-029';
const SANJI = 'OP09-028'; // {ODYSSEY}, cost 5 (its [On K.O.] is inert here)
const isRested = (g: ReturnType<typeof mk>, card: string) =>
  g.card(g.find('p1', 'characters', card)).rested;

describe('OP09-029 Tony Tony.Chopper', () => {
  it('[End of Your Turn]: sets up to 1 of your {ODYSSEY} Characters with a cost of 4 or less as active', () => {
    const g = mkOdyssey({ characters: [ID, rested(ODY.c4), rested(ODY.c3)] });
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', ODY.c4)]);
    expect(isRested(g, ODY.c4)).toBe(false);
    expect(isRested(g, ODY.c3)).toBe(true); // only 1
  });

  it('boundary: cost 4 is a candidate, cost 5 is not; a non-{ODYSSEY} Character is not', () => {
    const g = mk({ characters: [ID, rested(ODY.c4), rested(SANJI), rested(V.c2)] });
    g.act({ type: 'endTurn' });
    expect(canPick(g, g.find('p1', 'characters', ODY.c4))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', SANJI))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    none(g);
    expect(isRested(g, ODY.c4)).toBe(true);
  });

  it('Chopper ({ODYSSEY}, cost 3) can set himself as active', () => {
    const g = mk({ characters: [rested(ID)] });
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(isRested(g, ID)).toBe(false);
  });

  it('only your Characters: the opponent ODYSSEY Characters and Leaders are not candidates', () => {
    const g = mk({ characters: [ID, rested(ODY.c4)] }, { characters: [rested(ODY.c3)] });
    g.act({ type: 'endTurn' });
    expect(canPick(g, g.find('p2', 'characters', ODY.c3))).toBe(false);
    expect(canPick(g, g.leader('p1'))).toBe(false);
  });

  it("must not fire at the end of the opponent's turn", () => {
    const g = mk({ characters: [ID, rested(ODY.c4)] }, {}, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'endTurn' }); // p2's turn ends: p1's Chopper has no [End of Your Turn] now
    expectDecision(g, 'main', 'p1');
  });

  it('Chopper is a candidate even when active (up to 1 may be chosen for nothing)', () => {
    const g = mk({ characters: [ID] });
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    none(g);
    expect(dec(g)?.kind).toBe('main');
  });
});
