/** OP14-092 Mr.3(Galdino). */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, dec, expectDecision, pick, PURPLE, trash, V } from './helpers.ts';
import { koByBattle } from './helpers-op16g4.ts';
import { BW_LEADER, ids, koByEffect, settle, start } from './helpers-op14g4.ts';

const ID = 'OP14-092';
const TRASH = [BLUE, PURPLE, V.c1, V.c2];
const opp = { turn: 4, activePlayer: 'p2' } as const;
const run = (trashCards = TRASH, chars: string[] = [ID], extra: object = opp) =>
  start({ leader: BW_LEADER, characters: chars, trash: trashCards }, {}, extra);

describe('OP14-092 Mr.3(Galdino)', () => {
  it("on the opponent's turn, instead of a K.O.: places 3 trash cards at the bottom of the deck in the order picked", () => {
    const g = run();
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [
      g.find('p1', 'trash', V.c2),
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', PURPLE),
    ]);
    settle(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(-3)
        .map((c) => c.card),
    ).toEqual([V.c2, V.c1, PURPLE]);
  });

  it("the replacement may be declined: it is K.O.'d", () => {
    const g = run();
    koByEffect(g, 'p1', ID);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(5);
  });

  it('also replaces a K.O. in battle', () => {
    const g = koByBattle({ leader: BW_LEADER, trash: TRASH }, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [
      g.find('p1', 'trash', BLUE),
      g.find('p1', 'trash', PURPLE),
      g.find('p1', 'trash', V.c1),
    ]);
    settle(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
  });

  it('Once Per Turn: a second K.O. in the same turn is not replaced', () => {
    const g = run([BLUE, BLUE, BLUE, BLUE, BLUE, BLUE], [ID]);
    koByEffect(g, 'p1', ID);
    accept(g);
    pick(
      g,
      g
        .zone('p1', 'trash')
        .slice(0, 3)
        .map((c) => c.instance),
    );
    settle(g);
    koByEffect(g, 'p1', ID);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('on your own turn it does not apply', () => {
    const g = run(TRASH, [ID], {});
    koByEffect(g, 'p1', ID);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it("with only 2 cards in the trash the cost cannot be paid: no offer, it is K.O.'d", () => {
    const g = run([BLUE, PURPLE]);
    koByEffect(g, 'p1', ID);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});
