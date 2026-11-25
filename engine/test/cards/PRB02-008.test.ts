/** PRB02-008 Marco. */
import { describe, expect, it } from 'vitest';
import { BLUE, hand, times, V } from './helpers.ts';
import { finishBattle, mk } from './helpers-prbst.ts';
import { koBy } from './helpers-w3s.ts';

const ID = 'PRB02-008';

describe('PRB02-008 Marco', () => {
  const start = (p1 = {}, p2 = {}, extra = {}) =>
    mk({ characters: [ID], hand: times(2, BLUE), ...p1 }, p2, extra);

  it('has [Blocker] (printed)', () => {
    const g = start();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[On K.O.]: draws 2 cards when K.O.'d by an effect", () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    expect(hand(g, 'p1')).toHaveLength(4);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it("[On K.O.]: draws 2 cards when K.O.'d in battle", () => {
    const g = start(
      { characters: [{ card: ID, rested: true }] },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    finishBattle(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('must not fire: Marco surviving the battle (boundary: 6000 vs 5000) draws nothing', () => {
    const g = start(
      { characters: [{ card: ID, rested: true }] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c3),
      target: g.find('p1', 'characters', ID),
    });
    finishBattle(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});
