/** OP17-042 Kaido (Rocks): [Blocker]; [On Play] reveal 3 "Rocks Pirates" cards: −3000. */
import { describe, expect, it } from 'vitest';
import { accept, expectDecision, game, pick, play, PLAIN_PURPLE, ROCKS, V } from './helpers.ts';

describe('OP17-042 Kaido', () => {
  const ROCKS_CARDS = ['OP17-045', 'OP17-050', 'OP17-052'];

  it('reveals 3 "Rocks Pirates" cards from hand to give −3000; the cards stay in hand', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-042', ...ROCKS_CARDS], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c5] },
    );
    play(g, 'OP17-042');
    accept(g);
    pick(
      g,
      ROCKS_CARDS.map((c) => g.find('p1', 'hand', c)),
    );
    expect(g.eventsOfType('CardRevealed').map((e) => e.card)).toEqual(
      expect.arrayContaining(ROCKS_CARDS),
    );
    const t = g.find('p2', 'characters', V.c5);
    pick(g, [t]);
    expect(g.power(t)).toBe(4000);
    expect(g.zone('p1', 'hand')).toHaveLength(3);
    expect(g.card(g.find('p1', 'characters', 'OP17-042')).keywords).toContain('Blocker');
  });

  it('with only 2 "Rocks Pirates" cards the cost cannot be paid', () => {
    const g = game(
      {
        leader: ROCKS,
        hand: ['OP17-042', 'OP17-045', 'OP17-050'],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_PURPLE, characters: [V.c5] },
    );
    play(g, 'OP17-042');
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });
});
