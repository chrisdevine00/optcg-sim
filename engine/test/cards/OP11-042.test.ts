/** OP11-042 Vito. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { canPick, FIRE3, mk } from './helpers-op11g2.ts';

const ID = 'OP11-042';
const canAttack = (g: ReturnType<typeof mk>, c: string) =>
  g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', c));

describe('OP11-042 Vito', () => {
  it('[On Play]: trashing a {Firetank Pirates} card from hand gives it [Rush] this turn: it can attack at once', () => {
    const g = mk({ hand: [ID, FIRE3, V.c1] });
    play(g, ID);
    expect(canAttack(g, ID)).toBe(false); // the offer comes first
    accept(g);
    expect(canPick(g, g.find('p1', 'hand', FIRE3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false); // not {Firetank Pirates}
    pick(g, [g.find('p1', 'hand', FIRE3)]);
    expect(trash(g, 'p1')).toEqual([FIRE3]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(canAttack(g, ID)).toBe(true);
  });

  it('declining: nothing is trashed and it has no [Rush] (it cannot attack this turn)', () => {
    const g = mk({ hand: [ID, FIRE3] });
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([FIRE3]);
    expect(canAttack(g, ID)).toBe(false);
  });

  it('must not fire without a {Firetank Pirates} card in hand: the cost cannot be paid and there is no [Rush]', () => {
    const g = mk({ hand: [ID, V.c1, V.c2] });
    play(g, ID);
    // Offered with its cost unpayable (or not offered at all): either way it cannot be accepted.
    if (g.legal().some((a) => a.type === 'optional')) {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([]);
    expect(canAttack(g, ID)).toBe(false);
  });

  it('only one card is trashed even with two {Firetank Pirates} cards in hand', () => {
    const g = mk({ hand: [ID, FIRE3, FIRE3] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', FIRE3)]);
    expect(trash(g, 'p1')).toEqual([FIRE3]);
    expect(hand(g, 'p1')).toEqual([FIRE3]);
  });

  it('the [Rush] lasts this turn only: next turn it is a plain Character again (no extra keyword left)', () => {
    const g = mk({ hand: [ID, FIRE3] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', FIRE3)]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
  });
});
