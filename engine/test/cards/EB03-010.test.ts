/** EB03-010 Monet. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import { canPick, EVENT, finishOrder, mk, P0, P1000 } from './helpers-eb03g1.ts';

const ID = 'EB03-010';
// Top 5: a 1000-power Character, a 5000 Character, an Event, a 0-power Character, a 3000 Character.
const top5 = [P1000, V.c3, EVENT, P0, V.c1];
const onPlay = (deck = [...top5, ...times(5, BLUE)]) => {
  const g = mk({ hand: [ID], deck });
  play(g, ID);
  return g;
};

describe('EB03-010 Monet', () => {
  it('[On Play]: takes up to 1 Character with 1000 power or less; the other 4 go to the bottom', () => {
    const g = onPlay();
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', P1000))).toBe(true); // 1000 boundary
    expect(canPick(g, g.find('p1', 'deck', P0))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', EVENT))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c3))).toBe(false); // 5000
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false); // 3000
    pick(g, [g.find('p1', 'deck', P1000)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([P1000]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(9);
    expect(deck.slice(5).sort()).toEqual([V.c3, EVENT, P0, V.c1].sort());
  });

  it('an Event may be taken instead (one card in total)', () => {
    const g = onPlay();
    pick(g, [g.find('p1', 'deck', EVENT)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([EVENT]);
  });

  it('boundary: a Character with 1001 or more power is not eligible; the 6th card is not looked at', () => {
    const g = onPlay([V.c1, V.c2, V.c3, V.c4, V.c5, P1000, ...times(4, BLUE)]);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = onPlay();
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(5)
        .map((c) => c.card)
        .sort(),
    ).toEqual([...top5].sort());
  });

  it('[Blocker]: printed', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c3),
      target: g.leader('p1'),
    });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});
