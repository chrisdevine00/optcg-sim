/** EB03-054 Nico Robin (cost 3). */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, hand, pick, trash, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { cardsIn, mk } from './helpers-w4sb.ts';

const ID = 'EB03-054';
const deck = [V.c4, V.c5, V.c6];
const lifeCards = (g: ReturnType<typeof mk>) => g.zone('p1', 'life').map((c) => c.card);
const play = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

describe('EB03-054 Nico Robin', () => {
  it('[On Play]: trashing the top Life card adds the top deck card to the top of Life', () => {
    const g = mk({ hand: [ID], life: [V.c1, V.c2, V.c3], deck });
    play(g);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(trash(g, 'p1')).toEqual([V.c1]); // paid first, face up, no [Trigger]
    expectDecision(g, 'optional', 'p1'); // "up to 1"
    accept(g);
    expect(lifeCards(g)).toEqual([V.c4, V.c2, V.c3]);
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c5, V.c6]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('declining the cost does nothing', () => {
    const g = mk({ hand: [ID], life: [V.c1, V.c2, V.c3], deck });
    play(g);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(lifeCards(g)).toEqual([V.c1, V.c2, V.c3]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('"up to 1": after paying, the card may be left on the deck (the Life card stays lost)', () => {
    const g = mk({ hand: [ID], life: [V.c1, V.c2, V.c3], deck });
    play(g);
    accept(g);
    decline(g);
    expect(lifeCards(g)).toEqual([V.c2, V.c3]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('boundary: with 0 Life the cost cannot be paid and nothing is asked', () => {
    const g = mk({ hand: [ID], life: [], deck });
    play(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.life('p1')).toBe(0);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('[Trigger]: trash 1 card from hand to play this card', () => {
    const g = damageWith(ID, { hand: [V.c2, V.c3], deck });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
  });

  it('[Trigger]: with an empty hand the cost cannot be paid, so it cannot be activated', () => {
    const g = damageWith(ID, { hand: [], deck });
    expect(g.isLegal({ type: 'trigger', activate: true, player: 'p1' })).toBe(false);
    g.act({ type: 'trigger', activate: false });
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([ID]);
  });
});
