/**
 * OP16-093 Bartholomew Kuma (Character, Black, cost 3, 4000, Counter +1000, {Revolutionary Army}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[On Play] Draw 2 cards and trash 2 cards from your hand. Then, give up to 1 rested DON!!
 * card to your Leader or 1 of your Characters."
 *
 * Playing Kuma rests 3 DON!! (its cost), so rested DON!! exist at the time the effect resolves.
 *
 * Rules: CR 6-5-5 (given DON!!), CR 8-4-4-1 ("up to"), CR 2-7-2 (play cost is paid with active DON!!).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  choices,
  deck,
  deckOf,
  don,
  hand,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  p1main,
  pickCards,
  pickInst,
  playIt,
  reachablePickSets,
  SC16,
  SCN,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-093';
const X = SC16.wano3;
const Y = SC16.wano5;

function start(o: { field?: string[]; active?: number; rested?: number; p2?: string[] } = {}) {
  const g = p1main(
    LD16.wano,
    {
      hand: [ID, X, Y],
      characters: o.field ?? [SCN.c4],
      deck: deckOf([SC16.wano1, SC16.wano6]),
      costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
    },
    { characters: o.p2 ?? [SCN.c6] },
  );
  playIt(g, ID);
  return g;
}

describe('OP16-093 Bartholomew Kuma: [On Play] draw 2, trash 2, then give up to 1 rested DON!! to my Leader or a Character', () => {
  it('draws 2, trashes the 2 chosen, and gives a rested DON!! to the Leader', () => {
    const g = start();
    need(g, 'choose', 'p1');
    pickCards(g, [X, Y]);
    need(g, 'choose', 'p1');
    expect(don(g).rested).toBe(3);
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([X, Y].sort());
    expect(hand(g)).toEqual([SC16.wano1, SC16.wano6].sort());
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g).rested).toBe(2);
    expect(don(g).given).toBe(1);
  });

  it('the DON!! may go to one of my Characters instead (Kuma itself included)', () => {
    const g = start();
    pickCards(g, [X, Y]);
    expect(offeredIds(g)).toEqual([ID, SCN.c4, LD16.wano].sort()); // the two Characters and my Leader
    pickCards(g, [SCN.c4]);
    expect(g.card(at(g, 'p1', 'characters', SCN.c4)).don).toBe(1);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it("only my own Leader and Characters are candidates (not the opponent's)", () => {
    const g = start();
    pickCards(g, [X, Y]);
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).not.toContain(SCN.c6);
  });

  it('"up to 1": the DON!! may be left where it is; draw and trash still happen', () => {
    const g = start();
    pickCards(g, [X, Y]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(don(g).rested).toBe(3);
    expect(don(g).given).toBe(0);
  });

  it('gives exactly 1 DON!!, never 2', () => {
    const g = start();
    pickCards(g, [X, Y]);
    pickInst(g, [g.leader('p1')]);
    expect(don(g).given).toBe(1);
    expect(atMain(g)).toBe(true);
  });

  it('only a RESTED DON!! is given: the 3 DON!! rested by the play cost, never an active one', () => {
    const g = start({ active: 3, rested: 0 });
    pickCards(g, [X, Y]);
    expect(don(g).active).toBe(0);
    pickInst(g, [g.leader('p1')]);
    expect(don(g).rested).toBe(2);
    expect(don(g).active).toBe(0);
  });

  it('the given DON!! raises power by 1000 on my turn', () => {
    const g = start();
    pickCards(g, [X, Y]);
    pickCards(g, [SCN.c4]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c4))).toBe(7000);
  });

  it('the trash step is exactly 2 of the four cards in hand (drawn cards included)', () => {
    const g = start();
    expect(mayChooseNone(g)).toBe(false);
    const sets = [...reachablePickSets(g, 2)].map((k) => k.split('+'));
    expect([...new Set(sets.flat())].sort()).toEqual([X, Y, SC16.wano1, SC16.wano6].sort());
    for (const s of sets) expect(s).toHaveLength(2);
    act(g, { type: 'pick', choice: choices(g)[0]! });
    expect(mayChooseNone(g)).toBe(false);
  });

  it('the deck loses exactly 2 cards', () => {
    const g = start();
    pickCards(g, [X, Y]);
    none(g);
    expect(deck(g)).toHaveLength(10);
  });
});
