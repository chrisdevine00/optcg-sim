/** OP14-009 Trafalgar Law (Character). */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, passBlock, pick, V, endCounter } from './helpers.ts';
import { canHit, finishBattle, mk, p2Attacks } from './helpers-w4sb.ts';

const ID = 'OP14-009';
const hand3 = [V.c1, V.c2, V.c3];
const trashed = (g: ReturnType<typeof mk>) => g.zone('p1', 'trash').map((c) => c.card);

/** p2's 6000 Character attacks p1's Leader; p1 holds a 9000 Character besides Law. */
const attacked = (hand = hand3, extra: Record<string, unknown> = {}) =>
  p2Attacks({ leader: 'ST01-001', characters: [ID, V.c7], hand, ...extra });

describe('OP14-009 Trafalgar Law', () => {
  it('[Rush]: can attack the turn it is played', () => {
    const g = mk({ characters: [{ card: ID, playedThisTurn: true }] }, { characters: [V.c1] });
    expect(
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', ID),
        target: g.leader('p2'),
        player: 'p1',
      }),
    ).toBe(true);
    expect(canHit(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });

  it("[On Your Opponent's Attack]: trash 2 cards, swap your Leader's and a Character's base power during this battle", () => {
    const g = attacked();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]); // the cost
    pick(g, [g.find('p1', 'characters', V.c7)]); // the Character (the Leader is the only Leader)
    expect(trashed(g)).toEqual(expect.arrayContaining([V.c1, V.c2]));
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c7))).toBe(5000);
    passBlock(g);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 stops the 6000 attacker
    // The swap ended with the battle.
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c7))).toBe(9000);
  });

  it('may select itself as the Character', () => {
    const g = attacked(hand3, { characters: [ID] });
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(g.power(g.leader('p1'))).toBe(10000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('declining the optional cost trashes nothing and swaps nothing', () => {
    const g = attacked();
    decline(g);
    expect(trashed(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'block', 'p1');
  });

  it('with fewer than 2 cards in hand the cost cannot be paid: only declining is legal', () => {
    const g = attacked([V.c1]);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(trashed(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    finishBattle(g);
    expect(g.life('p1')).toBe(2);
  });

  it('is Once Per Turn: not offered on the second attack of the turn', () => {
    const g = p2Attacks(
      {
        leader: 'ST01-001',
        characters: [ID, V.c7],
        hand: [V.c1, V.c2, V.c3, V.c4],
        life: [V.c1, V.c1, V.c1, V.c1],
      },
      V.c4,
      [V.c4, V.c4],
    );
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    pick(g, [g.find('p1', 'characters', V.c7)]);
    passBlock(g);
    endCounter(g);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c4, 1),
      target: g.leader('p1'),
    });
    expect(dec(g)?.kind).not.toBe('optional');
  });
});
