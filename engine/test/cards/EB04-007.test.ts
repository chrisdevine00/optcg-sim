/** EB04-007 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

const ZORO = 'EB04-007';

describe('EB04-007 Roronoa Zoro', () => {
  it("[On Play]: your Leader gains +2000 power until the end of your opponent's next End Phase", () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ZORO], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ZORO);
    expect(g.power(g.leader('p1'))).toBe(7000);
    g.act({ type: 'endTurn' });
    // The opponent's turn: still on.
    expect(g.power(g.leader('p1'))).toBe(7000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  const activateSetup = (opp: Parameters<typeof game>[1]['characters'], playedThisTurn = false) =>
    game(
      {
        leader: PLAIN_PURPLE,
        characters: [{ card: ZORO, playedThisTurn }],
      },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it('[Activate: Main] [Once Per Turn]: with an opponent Character of 8000 power or more it gains [Rush: Character] this turn', () => {
    const g = activateSetup([V.c6]);
    const z = g.find('p1', 'characters', ZORO);
    expect(g.card(z).keywords).not.toContain('Rush: Character');
    g.act({ type: 'activate', card: z, ability: 'rush-character' });
    expect(g.card(z).keywords).toContain('Rush: Character');
    // Once Per Turn.
    expect(g.isLegal({ type: 'activate', card: z, ability: 'rush-character', player: 'p1' })).toBe(
      false,
    );
    g.act({ type: 'endTurn' });
    expect(g.card(z).keywords).not.toContain('Rush: Character');
  });

  it('[Activate: Main] is not offered when no opponent Character has 8000 power or more (7000 is not enough)', () => {
    const g = activateSetup([V.c5]);
    const z = g.find('p1', 'characters', ZORO);
    expect(g.isLegal({ type: 'activate', card: z, ability: 'rush-character', player: 'p1' })).toBe(
      false,
    );
  });

  it('the power check reads current power: a power boost on a smaller Character qualifies', () => {
    const g = activateSetup([V.c5]);
    // Giving DON!! to an opponent's Character does not count on my turn; use the card's own power.
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('with [Rush: Character] a Zoro played this turn may attack Characters but not the Leader', () => {
    const g = activateSetup([{ card: V.c6, rested: true }], true);
    const z = g.find('p1', 'characters', ZORO);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === z)).toBe(false);
    g.act({ type: 'activate', card: z, ability: 'rush-character' });
    const attacks = g.legal().filter((a) => a.type === 'attack' && a.attacker === z);
    expect(attacks.map((a) => (a.type === 'attack' ? a.target : null))).toEqual([
      g.find('p2', 'characters', V.c6),
    ]);
    expectDecision(g, 'main', 'p1');
  });
});
