/** OP17-062 Kaido: [Blocker]; [Your Turn] [Once Per Turn] when a DON!! on your field is returned. QA-OP08 OP08-074. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  don,
  expectDecision,
  game,
  KAIDO,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';

describe('OP17-062 Kaido', () => {
  it('a DON!! −2 cost on your turn: add 1 active DON!!, then set 1 DON!! active; once per turn', () => {
    const g = game(
      {
        leader: KAIDO,
        characters: ['OP17-062'],
        hand: ['OP17-075', 'OP17-075'],
        costArea: { active: 6, rested: 0 },
      },
      { leader: PLAIN_BLUE, hand: [PURPLE, PURPLE] },
    );
    play(g, 'OP17-075');
    accept(g);
    payDon(g);
    // 6 active − 2 (cost) − 2 returned + 1 added + 1 set active.
    expect(don(g, 'p1')).toMatchObject({ deck: 5, active: 4, rested: 1 });
    expect(g.card(g.find('p1', 'characters', 'OP17-062')).keywords).toContain('Blocker');
    play(g, 'OP17-075', 0);
    accept(g);
    payDon(g);
    // Spent: no more DON!! added.
    expect(don(g, 'p1').deck).toBe(7);
    void pick;
    void V;
    void expectDecision;
  });

  it("not on the opponent's turn", () => {
    const g = game(
      { leader: KAIDO, characters: ['OP17-062'], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(don(g, 'p1')).toMatchObject({ deck: 10, active: 0 });
  });
});
