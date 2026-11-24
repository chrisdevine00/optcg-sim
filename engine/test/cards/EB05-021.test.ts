/** EB05-021 Alvida. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { CROSS_GUILD, CROSS_GUILD_6 } from './helpers-eb05g2.ts';

const EVENT_0 = 'EB04-040'; // Event, cost 0
import { cardsOf, donArea } from './helpers-luffyace.ts';

const ALVIDA = 'EB05-021';
const start = (handCards: string[]) =>
  game({ leader: PLAIN_BLUE, hand: handCards, ...donArea(10) }, { leader: PLAIN_BLUE });

describe('EB05-021 Alvida', () => {
  it('[On Play] draws 2, then plays a {Cross Guild} Character with cost 8 or less from hand (the cost-9 one and non-{Cross Guild} are not offered)', () => {
    const g = start([ALVIDA, CROSS_GUILD, CROSS_GUILD_6, V.c2, ALVIDA]);
    play(g, ALVIDA);
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(6); // 4 left + 2 drawn
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', CROSS_GUILD)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ALVIDA, CROSS_GUILD]);
  });

  it('then you cannot play Character cards this turn, but Events are still playable', () => {
    const g = start([ALVIDA, CROSS_GUILD, BLUE, EVENT_0]);
    play(g, ALVIDA);
    pick(g, [g.find('p1', 'hand', CROSS_GUILD)]);
    expectDecision(g, 'main', 'p1');
    const blue = g.find('p1', 'hand', BLUE);
    expect(g.isLegal({ type: 'playCard', card: blue, player: 'p1' })).toBe(false);
    expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', EVENT_0), player: 'p1' })).toBe(
      true,
    );
  });

  it('"up to 1": playing nothing still applies the restriction', () => {
    const g = start([ALVIDA, CROSS_GUILD, BLUE]);
    play(g, ALVIDA);
    none(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ALVIDA]);
    expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', BLUE), player: 'p1' })).toBe(
      false,
    );
  });

  it("[When Attacking] negates up to 1 of the opponent's Characters this turn", () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ALVIDA] },
      { leader: PLAIN_BLUE, characters: [{ card: V.c1, rested: true }, V.c2] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', ALVIDA),
      target: g.find('p2', 'characters', V.c1),
    });
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.card(g.find('p2', 'characters', V.c2)).negated).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c1)).negated).toBeFalsy();
  });

  it('[When Attacking] with no opposing Character does nothing', () => {
    const g = game({ leader: PLAIN_BLUE, characters: [ALVIDA] }, { leader: PLAIN_BLUE });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ALVIDA), target: g.leader('p2') });
    passBlock(g);
    expect(g.eventsOfType('EffectDeclined')).toHaveLength(0);
  });
});
