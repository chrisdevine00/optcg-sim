/** OP11-057 Pedro. */
import { describe, expect, it } from 'vitest';
import { times, V } from './helpers.ts';
import { mk } from './helpers-op11g2.ts';

const ID = 'OP11-057';
/** p2's Character attacks p1's Leader; can Pedro block? */
const canBlock = (handSize: number, p1: object = {}): boolean => {
  const g = mk(
    { characters: [ID], hand: times(handSize, V.c1), ...p1 },
    { characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  return g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID));
};

describe('OP11-057 Pedro', () => {
  it('with 4 or less cards in hand it has [Blocker] (boundary: exactly 4)', () => {
    expect(canBlock(4)).toBe(true);
  });

  it('must not have [Blocker] with 5 cards in hand (boundary)', () => {
    expect(canBlock(5)).toBe(false);
  });

  it('with an empty hand it has [Blocker]', () => {
    expect(canBlock(0)).toBe(true);
  });

  it('the keyword follows the hand size as it changes (the listed keywords)', () => {
    const g = mk({ characters: [ID], hand: times(4, V.c1) });
    const pedro = g.find('p1', 'characters', ID);
    expect(g.card(pedro).keywords).toContain('Blocker');
    const h = mk({ characters: [ID], hand: times(5, V.c1) });
    expect(h.card(h.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });

  it("the opponent's hand size does not matter", () => {
    const g = mk(
      { characters: [ID], hand: times(5, V.c1) },
      { characters: [V.c7], hand: [] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(false);
  });
});
