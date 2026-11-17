/** OP01-055 You Can Be My Samurai!! */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { cardsOf, donArea, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'OP01-055';

describe('OP01-055 You Can Be My Samurai!!', () => {
  const start = (chars = [V.c1, V.c2, V.c3]) =>
    game(
      {
        leader: SHC_LEADER,
        hand: [ID],
        characters: chars,
        deck: [BLUE, PURPLE, BLUE],
        ...donArea(1),
      },
      { leader: PLAIN_BLUE },
    );

  it('[Main]: you may rest 2 of your Characters: draw 2 cards', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expectDecision(g, 'choose', 'p1');
    const a = g.find('p1', 'characters', V.c1);
    const b = g.find('p1', 'characters', V.c3);
    pick(g, [a, b]);
    expect(g.card(a).rested).toBe(true);
    expect(g.card(b).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', V.c2)).rested).toBe(false);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g, 'p1')).toEqual([BLUE, PURPLE]);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('declining the optional cost rests nothing and draws nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('with exactly 2 active Characters they are rested without a choice', () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    accept(g);
    expect(g.zone('p1', 'characters').every((c) => c.rested)).toBe(true);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('the cost is unpayable with fewer than 2 active Characters (a rested one cannot be rested again)', () => {
    const g = game(
      {
        leader: SHC_LEADER,
        hand: [ID],
        characters: [V.c1, { card: V.c2, rested: true }],
        ...donArea(1),
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
