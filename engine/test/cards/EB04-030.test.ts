/** EB04-030 Kaido. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  don,
  payDon,
  endCounter,
  expectDecision,
  game,
  KAIDO,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';

describe('EB04-030 Kaido', () => {
  it('[On Play] DON!! −2 with an Animal Kingdom Pirates Leader: gains Rush, then rests a cost 7 or less', () => {
    const g = game(
      { leader: KAIDO, hand: ['EB04-030'], costArea: { active: 9, rested: 0 }, donDeck: 1 },
      { leader: PLAIN_BLUE, characters: [V.c7] },
    );
    play(g, 'EB04-030');
    accept(g);
    payDon(g);
    const k = g.find('p1', 'characters', 'EB04-030');
    expect(g.card(k).keywords).toContain('Rush');
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(true);
    expect(g.isLegal({ type: 'attack', attacker: k, target: g.leader('p2'), player: 'p1' })).toBe(
      true,
    );
  });

  it('without the type, the "if" fails and the rest does not happen (CR 4-10-1)', () => {
    const g = game(
      { leader: 'OP12-061', hand: ['EB04-030'], costArea: { active: 9, rested: 0 }, donDeck: 1 },
      { leader: PLAIN_BLUE, characters: [V.c7] },
    );
    play(g, 'EB04-030');
    accept(g);
    payDon(g);
    expect(g.card(g.find('p1', 'characters', 'EB04-030')).keywords).not.toContain('Rush');
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(false);
    expect(don(g, 'p1').deck).toBe(3);
  });

  it("if it would be K.O.'d, return 1 DON!! instead", () => {
    const g = game(
      {
        leader: KAIDO,
        characters: [{ card: 'EB04-030', rested: true }],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [{ card: V.c7, don: 1 }] },
      { turn: 4, activePlayer: 'p2' },
    );
    const k = g.find('p1', 'characters', 'EB04-030');
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: k });
    // Kaido Leader's [On Your Opponent's Attack] asks first.
    g.act({ type: 'optional', accept: false });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'optional', 'p1');
    expect(g.state && expectDecision(g, 'optional').purpose).toBe('replacement');
    accept(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['EB04-030']);
    expect(don(g, 'p1')).toMatchObject({ active: 0 });
  });
});
