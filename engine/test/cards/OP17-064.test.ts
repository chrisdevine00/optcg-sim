/** OP17-064 King. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  game,
  PLAIN_BLUE,
  pick,
  passBlock,
  takeDamage,
  trash,
  V,
} from './helpers.ts';
import { OTHER_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-064';

describe('OP17-064 King', () => {
  const start = () =>
    game(
      { leader: OTHER_LEADER, characters: [ID, V.c1], hand: [BLUE, BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c6, V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
  const attack = (g: ReturnType<typeof start>, attacker: string) =>
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', attacker),
      target: g.leader('p1'),
    });

  it("[On Your Opponent's Attack]: you may trash 1 card: up to 1 of your Leader or Characters gains +2000 power during this battle", () => {
    const g = start();
    attack(g, V.c6);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    // Leader, King and the other Character are all candidates.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character (King himself) may receive the power', () => {
    const g = start();
    attack(g, V.c6);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    const king = g.find('p1', 'characters', ID);
    pick(g, [king]);
    expect(g.power(king)).toBe(12000);
  });

  it('declining keeps the hand and gives no power', () => {
    const g = start();
    attack(g, V.c6);
    decline(g);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('once per turn: a second attack in the same turn offers nothing', () => {
    const g = start();
    attack(g, V.c6);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    attack(g, V.c5);
    expectDecision(g, 'block', 'p1');
  });

  it('has [Blocker]', () => {
    const g = start();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
