/** OP11-058 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { times, V } from './helpers.ts';
import { mk } from './helpers-op11g2.ts';

const ID = 'OP11-058';
const canAttack = (handSize: number, opponentHand = 0): boolean => {
  const g = mk(
    { characters: [ID], hand: times(handSize, V.c1) },
    { hand: times(opponentHand, V.c1) },
  );
  return g
    .legal()
    .some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ID));
};

describe('OP11-058 Monkey.D.Luffy', () => {
  it('with 4 or less cards in hand it can attack (boundary: exactly 4)', () => {
    expect(canAttack(4)).toBe(true);
    expect(canAttack(0)).toBe(true);
  });

  it('with 5 or more cards in hand it cannot attack (boundary: exactly 5)', () => {
    expect(canAttack(5)).toBe(false);
    expect(canAttack(8)).toBe(false);
  });

  it('only your own hand counts', () => {
    expect(canAttack(4, 9)).toBe(true);
  });

  it('[Blocker]: printed, and it can still block with 5 or more cards in hand', () => {
    const g = mk(
      { characters: [ID], hand: times(6, V.c1) },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });

  it('the restriction is lifted as soon as the hand drops to 4 (a card played from hand)', () => {
    const g = mk({ characters: [ID], hand: [...times(4, V.c1), V.c2] });
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ID)),
    ).toBe(false);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', V.c2) });
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});
