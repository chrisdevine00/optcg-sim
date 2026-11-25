/** OP09-102 Professor Clover. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  handIds,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  passBlock,
  PLAIN_BLUE,
  pickableCards,
  pickCard,
  play,
  ROBIN_LEADER,
  settle,
  V,
  WITH_TRIGGER,
} from './helpers-a09g3.ts';

const ID = 'OP09-102';
const DECK = [V.c1, WITH_TRIGGER, V.c2, V.c3, V.c4, V.c5];

describe('OP09-102 Professor Clover', () => {
  const start = (leader: string, deck: string[] = DECK) =>
    mk({ leader, hand: [ID], deck }, {}, undefined, 1);

  it('[On Play] with a [Nico Robin] Leader: look at 3, add up to 1 card with a [Trigger] to hand, the rest to the bottom', () => {
    const g = start(ROBIN_LEADER);
    play(g, ID);
    expect(pickableCards(g)).toEqual([WITH_TRIGGER]);
    pickCard(g, WITH_TRIGGER);
    settle(g);
    expect(handIds(g, 'p1')).toEqual([WITH_TRIGGER]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck.slice(0, 3)).toEqual([V.c3, V.c4, V.c5]);
    expect(deck.slice(3).sort()).toEqual([V.c1, V.c2].sort());
  });

  it('"up to 1": may take nothing', () => {
    const g = start(ROBIN_LEADER);
    play(g, ID);
    none(g);
    settle(g);
    expect(handIds(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')).toHaveLength(6);
  });

  it('only the top 3 are looked at', () => {
    const g = start(ROBIN_LEADER, [V.c1, V.c2, V.c3, WITH_TRIGGER, V.c4]);
    play(g, ID);
    expect(pickableCards(g)).toEqual([]);
  });

  it('must not look without a [Nico Robin] Leader', () => {
    const g = start(OTHER_LEADER);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'deck')).toEqual(DECK);
    expect(handIds(g, 'p1')).toEqual([]);
  });

  it('[Trigger] activates the [On Play] effect', () => {
    const g = game(
      { leader: ROBIN_LEADER, life: [ID, V.c1], deck: DECK },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    expect(pickableCards(g)).toEqual([WITH_TRIGGER]);
    pickCard(g, WITH_TRIGGER);
    settle(g);
    expect(handIds(g, 'p1')).toEqual([WITH_TRIGGER]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
  });
});
