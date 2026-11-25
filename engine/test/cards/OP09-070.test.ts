/** OP09-070 Nami. */
import { describe, expect, it } from 'vitest';
import {
  dec,
  decline,
  don,
  expectDecision,
  game,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
  V,
} from './helpers.ts';
import { canPick, payReturn } from './helpers-w5c1.ts';

const ID = 'OP09-070';
const start = (active = 10, donDeck?: number) =>
  game(
    {
      leader: PLAIN_PURPLE,
      hand: [ID],
      characters: [V.c1],
      costArea: { active, rested: 0 },
      ...(donDeck === undefined ? {} : { donDeck }),
    },
    { leader: PLAIN_BLUE },
  );

describe('OP09-070 Nami', () => {
  it('[On Play] returning DON!!: gives 2 rested DON!! to your Leader', () => {
    const g = start();
    play(g, ID);
    payReturn(g, 1);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['2', '1', '0']);
    option(g, '2');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(g.card(g.leader('p1')).power).toBe(7000); // +1000 per DON!! given, on your turn
    expect(dec(g)?.kind).toBe('main');
  });

  it('the DON!! can go to 1 of your Characters instead, and only one card receives them', () => {
    const g = start();
    play(g, ID);
    payReturn(g, 1);
    option(g, '2');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(2);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('"up to 2": 1 or none can be given', () => {
    const one = start();
    play(one, ID);
    payReturn(one, 1);
    option(one, '1');
    pick(one, [one.leader('p1')]);
    expect(one.card(one.leader('p1')).don).toBe(1);

    const zero = start();
    play(zero, ID);
    payReturn(zero, 1);
    option(zero, '0');
    expect(dec(zero)?.kind).toBe('main');
    expect(zero.card(zero.leader('p1')).don).toBe(0);
  });

  it('declining the cost gives nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g, 'p1')).toMatchObject({ active: 7, rested: 3 });
  });

  it('the DON!! the cost returned cannot be given: with 3 on the field and all returned, nothing is rested to give', () => {
    const g = start(3, 7);
    play(g, ID);
    payReturn(g, 3);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('returning 2 of the 3 rested DON!! leaves 1 to give: it is the most that can be given', () => {
    const g = start(3, 7);
    play(g, ID);
    payReturn(g, 2);
    const d = dec(g);
    // One rested DON!! is left: either asked as "1 or none" or given straight away.
    if (d?.kind === 'choose' && d.options?.some((o) => o.id === '1')) {
      expect(d.options.map((o) => o.id)).toEqual(['1', '0']);
      option(g, '1');
    }
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });
});
