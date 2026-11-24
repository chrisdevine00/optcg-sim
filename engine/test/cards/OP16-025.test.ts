/** OP16-025 Bunkov. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import { idsIn, offers, RED_LEADER } from './helpers-op16g1.ts';

const ID = 'OP16-025';
const PARTNER = 'OP16-029'; // Antlerkov
/** OP02-022: a cost 1 Event (never a Character, so it can never be played by an effect). */
const COST1_EVENT = 'OP02-022';

describe('OP16-025 Bunkov', () => {
  const start = (partner: boolean, rested = false) =>
    game(
      {
        leader: RED_LEADER,
        hand: [V.c1, V.c2, V.c3, COST1_EVENT],
        characters: [ID, ...(partner ? [{ card: PARTNER, rested }] : [])],
      },
      { leader: PLAIN_BLUE },
    );
  const attack = (g: ReturnType<typeof start>) =>
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

  it('[When Attacking]: if you have [Antlerkov], play up to 1 Character card with a cost of 2 or less from your hand', () => {
    const g = start(true);
    attack(g);
    expectDecision(g, 'choose', 'p1');
    // Cost 1 and 2 Characters are offered (2 is inclusive); the cost 3 Character and the Event are not.
    expect(offers(g, g.find('p1', 'hand', V.c1))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', V.c2))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', V.c3))).toBe(false);
    expect(offers(g, g.find('p1', 'hand', COST1_EVENT))).toBe(false);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(idsIn(g, 'p1', 'characters')).toEqual([ID, PARTNER, V.c2]);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('a rested [Antlerkov] still counts as "you have"', () => {
    const g = start(true, true);
    attack(g);
    expectDecision(g, 'choose', 'p1');
  });

  it('without [Antlerkov] nothing is played', () => {
    const g = start(false);
    attack(g);
    expectDecision(g, 'block', 'p2');
    expect(idsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('"up to 1": nothing needs to be played', () => {
    const g = start(true);
    attack(g);
    none(g);
    expect(idsIn(g, 'p1', 'characters')).toEqual([ID, PARTNER]);
    expect(hand(g, 'p1')).toHaveLength(4);
  });
});
