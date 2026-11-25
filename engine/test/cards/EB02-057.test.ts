/** EB02-057 Mad Treasure. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  game,
  hand,
  none,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { canAccept, ids, optionIds, pickableCardIds } from './helpers-w7c1.ts';

const ID = 'EB02-057';

describe('EB02-057 Mad Treasure', () => {
  const mk = (p1: object = {}, p2: object = {}) =>
    game(
      { leader: PLAIN_PURPLE, characters: [ID], life: [V.c3, V.c1, V.c2], ...p1 },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c4], life: [V.c6, V.c4, V.c5], ...p2 },
    );
  const attack = (g: ReturnType<typeof mk>) =>
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', ID),
      target: g.leader('p2'),
    });

  it('[When Attacking]: pay 1 Life card from the top to your hand, then the opponent Character goes to the top of their Life face-up', () => {
    const g = mk();
    attack(g);
    expect(canAccept(g)).toBe(true);
    accept(g);
    expect(optionIds(g)).toEqual(['top', 'bottom']);
    option(g, 'top');
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(ids(g, 'p1', 'life')).toEqual([V.c1, V.c2]);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    option(g, 'top');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
    const life = g.zone('p2', 'life');
    expect(life.map((c) => c.card)).toEqual([V.c3, V.c6, V.c4, V.c5]);
    expect(life[0]!.faceUp).toBe(true);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('the Life card paid may be the bottom one, and the Character may go to the bottom of their Life', () => {
    const g = mk();
    attack(g);
    accept(g);
    option(g, 'bottom');
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(ids(g, 'p1', 'life')).toEqual([V.c3, V.c1]);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    option(g, 'bottom');
    expect(ids(g, 'p2', 'life')).toEqual([V.c6, V.c4, V.c5, V.c3]);
    expect(g.zone('p2', 'life')[3]!.faceUp).toBe(true);
  });

  it('boundary: a cost of 3 is a target, a cost of 4 is not', () => {
    const g = mk();
    attack(g);
    accept(g);
    option(g, 'top');
    expect(pickableCardIds(g)).toEqual([V.c3]);
  });

  it('"up to 1": picking none moves nothing, but the Life card was spent', () => {
    const g = mk();
    attack(g);
    accept(g);
    option(g, 'top');
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
    expect(g.life('p2')).toBe(3);
    expect(hand(g, 'p1')).toEqual([V.c3]);
  });

  it('must not fire when declined, or without a Life card to pay with', () => {
    const g = mk();
    attack(g);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);

    const noLife = mk({ life: [] });
    attack(noLife);
    expect(canAccept(noLife)).toBe(false);
    expect(dec(noLife)?.kind).not.toBe('optional');
    expect(ids(noLife, 'p2', 'characters')).toEqual([V.c3, V.c4]);
  });
});
