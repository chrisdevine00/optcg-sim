/** OP10-119 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { cardsOf, OTHER_LEADER, SN4, SN5, SN_LEADER, start } from './helpers-a10g4.ts';

const ID = 'OP10-119';
const ODY = 'OP09-038'; // not {Supernovas}

const board = (handCards: string[], leader = SN_LEADER, life = [V.c1, V.c2]) =>
  start({ hand: [ID, ...handCards], leader, life, costArea: { active: 7, rested: 0 } });

describe('OP10-119 Trafalgar Law', () => {
  it('[On Play]: adds a {Supernovas} Character from the hand to the top of Life face-down, then gives 1 rested DON!! to the Leader', () => {
    const g = board([SN5, V.c3]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', SN5)]);
    expect(cardsOf(g, 'p1', 'life')).toEqual([SN5, V.c1, V.c2]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 6, given: 1 }); // 7 paid, 1 of them now on the Leader
  });

  it('only {Supernovas} Characters are offered (not other types or a card of another type)', () => {
    const g = board([SN4, ODY, V.c3]);
    play(g, ID);
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered).toEqual([g.find('p1', 'hand', SN4)]);
  });

  it('"up to 1": may add nothing, and the DON!! is still given ("Then" is not "if you do")', () => {
    const g = board([SN5]);
    play(g, ID);
    none(g);
    expect(g.life('p1')).toBe(2);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('with no {Supernovas} Character in hand the pick is asked at max 0 (the hand is not leaked) and the DON!! is still given', () => {
    const g = board([ODY, V.c3]);
    play(g, ID);
    expect(dec(g)).toMatchObject({ kind: 'choose', max: 0 });
    none(g);
    expect(g.life('p1')).toBe(2);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('a Leader that is not {Supernovas} gets no DON!!, but the Life add still happens', () => {
    const g = board([SN5], OTHER_LEADER);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', SN5)]);
    expect(g.life('p1')).toBe(3);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(dec(g)?.kind).toBe('main');
  });
});
