/** OP17-063 Kaido. QA-OP17 OP17-063; E-Q1. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { don, expectDecision, game, KAIDO, pick, PLAIN_BLUE, PURPLE, V } from './helpers.ts';

describe('OP17-063 Kaido', () => {
  it('Character cards in hand without a Counter have a +1000 Counter; others keep theirs', () => {
    const g = game(
      { leader: KAIDO, characters: ['OP17-063'], hand: ['EB04-031', PURPLE, 'OP17-077'] },
      { leader: PLAIN_BLUE },
    );
    const c = (id: string) => queries.card(g.state, g.find('p1', 'hand', id)).counter;
    expect(c('EB04-031')).toBe(1000);
    expect(c(PURPLE)).toBe(1000);
    expect(c('OP17-077')).toBe(null); // an Event
  });

  it('[Activate: Main] on the turn it was played: negate and K.O. a cost 6 or less; its replacement does not apply', () => {
    const g = game(
      {
        leader: KAIDO,
        characters: [{ card: 'OP17-063', playedThisTurn: true }],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: ['EB04-031'], costArea: { active: 0, rested: 2 } },
    );
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP17-063'), ability: 'negate-ko' });
    pick(g, [g.find('p2', 'characters', 'EB04-031')]);
    // King would replace its own K.O., but it is negated (CR 8-2-1-1): no optional for p2.
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual(['EB04-031']);
    expect(don(g, 'p2').deck).toBe(8);
  });

  it('on a later turn the DON!! −1 is paid and nothing else happens', () => {
    const g = game(
      { leader: KAIDO, characters: ['OP17-063'], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP17-063'), ability: 'negate-ko' });
    expect(don(g, 'p1').deck).toBe(10);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
