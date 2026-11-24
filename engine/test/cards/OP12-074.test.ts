/** OP12-074 Patty. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  decline,
  dec,
  don,
  expectDecision,
  option,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { canAccept, EVENT, mine, NAVY_LEADER, offered, SANJI_LEADER } from './helpers-op12g2.ts';

const ID = 'OP12-074';

describe('OP12-074 Patty', () => {
  const start = (leader: string, handCards: string[] = [EVENT, V.c1]) =>
    mine({ leader, hand: [ID, ...handCards] });

  it('trash 1 Event: with a [Sanji] Leader add 1 DON!! and set it as active', () => {
    const g = start(SANJI_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT)]);
    expect(trash(g, 'p1')).toEqual([EVENT]);
    expectDecision(g, 'choose', 'p1');
    addMost(g);
    // Patty cost 3 rested 3 of 5; the new DON!! is active.
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 3 });
  });

  it('only an Event can be trashed: other cards are not candidates', () => {
    const g = start(SANJI_LEADER);
    play(g, ID);
    accept(g);
    expect(offered(g)).toEqual([g.find('p1', 'hand', EVENT)]);
  });

  it('the Leader check follows the colon: with another Leader the Event is trashed and nothing is added', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT)]);
    expect(trash(g, 'p1')).toEqual([EVENT]);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });

  it('"up to 1": the Event is trashed and the DON!! may be declined', () => {
    const g = start(SANJI_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT)]);
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options!.at(-1)!.id);
    expect(trash(g, 'p1')).toEqual([EVENT]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });

  it('declining the cost trashes nothing and adds nothing', () => {
    const g = start(SANJI_LEADER);
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });

  it('with no Event in hand the cost cannot be paid', () => {
    const g = start(SANJI_LEADER, [V.c1]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(false);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });
});
