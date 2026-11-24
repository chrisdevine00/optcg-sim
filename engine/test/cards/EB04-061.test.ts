/** EB04-061 Monkey.D.Luffy (Character). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  pick,
  play,
  PLAIN_BLUE,
  times,
  trash,
} from './helpers.ts';
import { canAccept, idsOf, SUPERNOVAS_LEADER } from './helpers-stg2.ts';

const ID = 'EB04-061';
const start = (life: number, active: number, handCards: string[] = [BLUE]) =>
  game(
    {
      leader: SUPERNOVAS_LEADER,
      hand: [ID, ...handCards],
      life: times(life, BLUE),
      costArea: { active, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('EB04-061 Monkey.D.Luffy', () => {
  it('in hand: -1 cost with 1 Life card (boundary), and with 0', () => {
    expect(start(1, 9).card(start(1, 9).find('p1', 'hand', ID)).cost).toBe(9);
    const g = start(0, 9);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(9);
    expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', ID), player: 'p1' })).toBe(
      true,
    );
  });

  it('with 2 Life cards it costs its printed 10 and 9 DON!! is not enough', () => {
    const g = start(2, 9);
    const id = g.find('p1', 'hand', ID);
    expect(g.card(id).cost).toBe(10);
    expect(g.isLegal({ type: 'playCard', card: id, player: 'p1' })).toBe(false);
  });

  it('[On Play] trash 1 card: the Leader gains +2000 power and this Character gains [Blocker] until the end of the opponent next End Phase', () => {
    const g = start(1, 9);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expectDecision(g, 'main', 'p1');
    const me = g.find('p1', 'characters', ID);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.card(me).keywords).toContain('Blocker');
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(7000); // still the opponent's turn
    expect(g.card(me).keywords).toContain('Blocker');
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(me).keywords).not.toContain('Blocker');
  });

  it('the cost may be declined: no power, no [Blocker]', () => {
    const g = start(1, 9);
    play(g, ID);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
    expect(idsOf(g, 'p1', 'hand')).toEqual([BLUE]);
  });

  it('with no other card in hand the cost cannot be paid: nothing happens', () => {
    const g = start(1, 9, []);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(false);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });
});
