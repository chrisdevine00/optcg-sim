/** OP11-049 Carrot. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  option,
  passBlock,
  play,
  takeDamage,
  trash,
  V,
} from './helpers.ts';
import { cardsOf, finishOrder, mk } from './helpers-op11g2.ts';

const ID = 'OP11-049';
const deck = [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, BLUE];

describe('OP11-049 Carrot', () => {
  it('[On Play]: looks at 3 and puts them back on top (in the order chosen); the 4th card stays below them', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    option(g, 'top');
    finishOrder(g);
    const after = cardsOf(g, 'p1', 'deck');
    expect(after.slice(0, 3).sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(after.slice(3)).toEqual([V.c4, V.c5, V.c6, BLUE]);
  });

  it('[On Play]: all 3 can go to the bottom; the 4th card becomes the top', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    option(g, 'bottom');
    finishOrder(g);
    const after = cardsOf(g, 'p1', 'deck');
    expect(after.slice(0, 4)).toEqual([V.c4, V.c5, V.c6, BLUE]);
    expect(after.slice(4).sort()).toEqual([V.c1, V.c2, V.c3].sort());
  });

  const under = () =>
    mk({ characters: [ID] }, { characters: [V.c7] }, { turn: 4, activePlayer: 'p2' });
  const attack = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });

  it("[On Your Opponent's Attack]: trashing this Character gives your Leader +1000 power during this battle", () => {
    const g = under();
    attack(g);
    accept(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.power(g.leader('p1'))).toBe(6000);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000); // during this battle only
  });

  it('declining the optional trash: Carrot stays and the Leader is not boosted', () => {
    const g = under();
    attack(g);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expectDecision(g, 'block', 'p1');
  });

  it('must not fire on your own attack: nothing is offered when you attack', () => {
    const g = mk({ characters: [ID, V.c7] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c7), target: g.leader('p2') });
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
  });
});
