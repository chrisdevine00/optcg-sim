/** OP07-076 Slow-Slow Beam Sword. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, KAIDO, passBlock, pick, PLAIN_BLUE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';

describe('OP07-076 Slow-Slow Beam Sword', () => {
  it("[Counter] DON!! −1: +2000 for the battle, then rest an opponent's Character", () => {
    const g = game(
      { leader: KAIDO, hand: ['OP07-076'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'optional', accept: false });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP07-076'), ability: 'counter' });
    // Cost 2 rests 2 of 3 active; DON!! −1 then chooses active or rested.
    if (expectDecision(g, 'choose').purpose === 'cost')
      g.act({ type: 'pick', choice: { from: 'costRested' } });
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1, deck: 8 });
  });

  it('[Trigger] adds 1 active DON!!', () => {
    const g = damageWith('OP07-076', { donDeck: 10 });
    g.act({ type: 'trigger', activate: true });
    expect(don(g, 'p1')).toMatchObject({ active: 1, deck: 9 });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP07-076']);
  });
});
