/** OP09-075 Eustass"Captain"Kid. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  canAccept,
  dec,
  decline,
  don,
  expectDecision,
  KID_LEADER,
  mk,
  OTHER_LEADER,
  play,
  V,
} from './helpers-a09g3.ts';
import { handIds } from './helpers-a09g3.ts';

const ID = 'OP09-075';
const LIFE = [V.c5, V.c2, V.c1];
// Cost 3: three active DON!! pay for the card, seven stay in the DON!! deck.
const start = (p1: object = {}, leader: string = KID_LEADER) =>
  mk({ hand: [ID], life: LIFE, ...p1 }, {}, leader, 3);

describe('OP09-075 Eustass"Captain"Kid', () => {
  it('[On Play] add the top Life card to your hand: with a {Kid Pirates} Leader, add 1 DON!! as active', () => {
    const g = start();
    play(g, ID);
    accept(g);
    addMost(g);
    expect(handIds(g, 'p1')).toEqual([V.c5]);
    expect(g.life('p1')).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3, deck: 6 });
    expectDecision(g, 'main', 'p1');
  });

  it('declining the cost leaves Life and DON!! as they were', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(handIds(g, 'p1')).toEqual([]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });

  it('must not add DON!! without a {Kid Pirates} Leader (the Life card is still added: effect condition)', () => {
    const g = start({}, OTHER_LEADER);
    play(g, ID);
    accept(g);
    expect(dec(g)?.kind).toBe('main');
    expect(handIds(g, 'p1')).toEqual([V.c5]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });

  it('with an empty DON!! deck the DON!! is not added, the Life card still is', () => {
    const g = mk({ hand: [ID], life: LIFE }, {}, KID_LEADER, 10);
    play(g, ID);
    accept(g);
    while (dec(g)?.kind === 'choose') addMost(g);
    expect(handIds(g, 'p1')).toEqual([V.c5]);
    expect(don(g, 'p1')).toMatchObject({ active: 7, rested: 3, deck: 0 });
  });

  it('must not be offered the cost with no Life cards', () => {
    const g = start({ life: [] });
    play(g, ID);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });
});
