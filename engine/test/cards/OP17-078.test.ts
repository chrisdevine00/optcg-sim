/** OP17-078 Drunken Dragon Bagua. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  BLUE,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  payDon,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
  PURPLE,
  trash,
  V,
} from './helpers.ts';

const ID = 'OP17-078';
const start = (leader: string, active = 4) =>
  game(
    { leader, hand: [ID, BLUE, PURPLE, BLUE], costArea: { active, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP17-078 Drunken Dragon Bagua', () => {
  it('[Main] rest 2 DON!! and trash 2 cards: with an {Animal Kingdom Pirates} Leader, adds 3 rested DON!!', () => {
    const g = start(PLAIN_PURPLE);
    play(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', BLUE, 0)]);
    addMost(g);
    expect(trash(g, 'p1')).toHaveLength(3); // the Event and 2 cards
    expect(hand(g, 'p1')).toHaveLength(1);
    // 2 rested to play the Event, 2 rested for the cost, 3 more added rested
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7, deck: 3 });
  });

  it('with another Leader type the cost is paid but no DON!! is added', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', BLUE, 0)]);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
  });

  it('declining the optional cost does nothing beyond playing the Event', () => {
    const g = start(PLAIN_PURPLE);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 2 });
  });

  it('cannot pay the cost with only 1 DON!! left active after playing the Event', () => {
    const g = start(PLAIN_PURPLE, 3);
    play(g, ID);
    // 1 active DON!! left: "rest 2 DON!!" cannot be paid, so the effect is not offered or fails.
    if (g.legal().some((a) => a.type === 'optional' && a.accept)) decline(g);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(don(g, 'p1').deck).toBe(7);
  });

  it('[Counter] up to 1 of your Leader or Characters gains +4000 power during this battle', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expectDecision(g, 'counter');
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 stops the 8000 attacker
  });
});
