/** OP09-052 Marco. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  pick,
  trash,
  V,
} from './helpers.ts';
import { ids, koBy, koByEffect, mk, RED_LEADER } from './helpers-a09g2.ts';

const ID = 'OP09-052';
const opp = { turn: 4, activePlayer: 'p2' } as const;
const H = [V.c1, V.c2];
const start = (handCards: string[] = H, extra: object = {}) =>
  mk({ characters: [ID], hand: handCards, ...extra }, {}, opp);

describe('OP09-052 Marco', () => {
  it("[Opponent's Turn] K.O.'d by your opponent's effect: you may trash 1 card, then he is played from the trash rested", () => {
    const g = start();
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('"you may": declining leaves Marco in the trash and the hand untouched', () => {
    const g = start();
    koByEffect(g, 'p1', ID);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual(H);
  });

  it('with an empty hand the cost cannot be paid: accepting is illegal and Marco stays in the trash', () => {
    const g = start([]);
    koByEffect(g, 'p1', ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it("does not fire when K.O.'d in battle (raw decisions, nothing is offered)", () => {
    const g = game(
      { leader: RED_LEADER, characters: [{ card: ID, rested: true }], hand: H },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      opp,
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    expect(dec(g)?.kind).not.toBe('optional');
    passBlock(g);
    endCounter(g);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it("does not fire when K.O.'d by your own effect", () => {
    const g = start();
    koBy(g, 'p1', ID, 'p1');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it("does not fire on your own turn, even for an opponent's effect", () => {
    const g = mk({ characters: [ID], hand: H });
    koByEffect(g, 'p1', ID);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('costs no DON!!: only the hand card is paid', () => {
    const g = start();
    koByEffect(g, 'p1', ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0 });
  });
});
