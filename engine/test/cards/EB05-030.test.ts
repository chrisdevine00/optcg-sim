/** EB05-030 Take Care, Everybody. ♡ */
import { describe, expect, it } from 'vitest';
import {
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { cardsOf, donArea } from './helpers-luffyace.ts';
import { NAMI_LEADER } from './helpers-eb05g2.ts';

const TAKE_CARE = 'EB05-030';
const start = (leader: string, p1Chars: string[], p2Chars: string[]) =>
  game(
    { leader, hand: [TAKE_CARE], characters: p1Chars, ...donArea(2) },
    { leader: PLAIN_BLUE, characters: p2Chars },
  );

describe('EB05-030 Take Care, Everybody. ♡', () => {
  it("[Main] with [Nami] as Leader, returns a Character with cost 5 or less to its owner's hand", () => {
    const g = start(NAMI_LEADER, [], [V.c5, V.c6]);
    play(g, TAKE_CARE);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(hand(g, 'p2')).toEqual([V.c5]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('may return your own Character too (any Character with cost 5 or less)', () => {
    const g = start(NAMI_LEADER, [V.c2], []);
    play(g, TAKE_CARE);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('a Character with cost 6 is never offered; "up to 1" lets you choose nothing', () => {
    const g = start(NAMI_LEADER, [], [V.c6]);
    play(g, TAKE_CARE);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6]);
    const h = start(NAMI_LEADER, [], [V.c1]);
    play(h, TAKE_CARE);
    none(h);
    expect(cardsOf(h, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('without [Nami] as Leader the [Main] does nothing', () => {
    const g = start(PLAIN_BLUE, [], [V.c1]);
    play(g, TAKE_CARE);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([TAKE_CARE]);
  });

  it('[Counter] draws 1 and gives +1000 power during this turn (it outlasts the battle)', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [TAKE_CARE], ...donArea(2) },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c1] },
      { turn: 4, activePlayer: 'p2' },
    );
    const base = g.power(g.leader('p1'))!;
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', TAKE_CARE), ability: 'counter' });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(base + 1000);
    expect(hand(g, 'p1')).toHaveLength(1); // the Event left the hand; the drawn card is the only one
    expect(g.zone('p1', 'deck')).toHaveLength(9);
  });
});
