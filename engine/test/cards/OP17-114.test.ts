/** OP17-114 Sweet 3 Generals: [Your Turn] [On Play] rest 2 DON!!: draw 1, add 1 card to Life, then up to 2 opponent Characters get -3000; [Trigger] play this card. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { ENEL, ids, triggerHit } from './helpers-robin.ts';

const SWEET = 'OP17-114';

const setup = () =>
  game(
    {
      leader: ENEL,
      hand: [SWEET],
      deck: [PURPLE, BLUE, BLUE, BLUE],
      costArea: { active: 8, rested: 0 },
    },
    { leader: PLAIN_BLUE, characters: [V.c3, V.c5, V.c7] },
  );

describe('OP17-114 Sweet 3 Generals', () => {
  it('[On Play] rest 2 DON!!: draw 1, add 1 card to Life, then up to 2 Characters get -3000 this turn', () => {
    const g = setup();
    play(g, SWEET);
    accept(g);
    payDon(g);
    accept(g); // add the (next) top card to Life
    const a = g.find('p2', 'characters', V.c3);
    const b = g.find('p2', 'characters', V.c5);
    const c = g.find('p2', 'characters', V.c7);
    pick(g, [a, b]);
    expect(hand(g, 'p1')).toEqual([PURPLE]); // drew the top card first
    expect(g.life('p1')).toBe(4);
    expect(ids(g, 'p1', 'life')[0]).toBe(BLUE); // then the next card went to Life
    expect(g.power(a)).toBe(2000);
    expect(g.power(b)).toBe(4000);
    expect(g.power(c)).toBe(9000);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 8 });
  });

  it('[On Play] "Then": the power change still applies when the Life card is declined', () => {
    const g = setup();
    play(g, SWEET);
    accept(g);
    payDon(g);
    decline(g);
    const a = g.find('p2', 'characters', V.c3);
    pick(g, [a]);
    expect(g.life('p1')).toBe(3);
    expect(g.power(a)).toBe(2000);
  });

  it('[On Play] the DON!! cost may be declined: nothing happens', () => {
    const g = setup();
    play(g, SWEET);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expectDecision(g, 'main', 'p1');
  });

  it('[Trigger] plays this card; on the opponent turn the [On Play] does not activate', () => {
    const g = triggerHit(SWEET, { costArea: { active: 4, rested: 0 } });
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([SWEET]);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p2');
  });
});
