/** OP17-045 Kyo. QA-OP17 OP17-045. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  payDon,
  pick,
  play,
  ROCKS,
  trash,
  V,
  KAIDO,
} from './helpers.ts';

describe('OP17-045 Kyo', () => {
  it('[On Play] draws 1', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-045'], costArea: { active: 2, rested: 0 } },
      { leader: KAIDO },
    );
    play(g, 'OP17-045');
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  const koByEffect = (handCards: string[]) => {
    // p2 (Kaido) K.O.s p1's Character with Gum-Gum Lightning (an opponent's effect).
    const g = game(
      { leader: ROCKS, characters: ['OP17-045', V.c4], hand: handCards },
      { leader: KAIDO, hand: ['OP09-077'], costArea: { active: 4, rested: 0 } },
      { turn: 4, activePlayer: 'p2' },
    );
    play(g, 'OP09-077');
    accept(g); // DON!! −X on an Event is optional (CR 8-3-1-4, QA-ST01–04 ST04-016)
    payDon(g);
    pick(g, [g.find('p1', 'characters', V.c4)]);
    return g;
  };

  it("saves a Character removed by the opponent's effect by trashing 2 cards", () => {
    const g = koByEffect([BLUE, BLUE]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(
      g,
      g.zone('p1', 'hand').map((c) => c.instance),
    );
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c4);
    expect(trash(g, 'p1')).toEqual([BLUE, BLUE]);
  });

  it('QA-OP17 OP17-045: with 1 card in hand it cannot be used', () => {
    const g = koByEffect([BLUE]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(V.c4);
    expectDecision(g, 'main', 'p2');
  });

  it('does not apply to a battle K.O.', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-045', { card: V.c1, rested: true }], hand: [BLUE, BLUE] },
      { leader: KAIDO, characters: [V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c5),
      target: g.find('p1', 'characters', V.c1),
    });
    if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false }); // Kaido Leader
    passBlock(g);
    endCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP17-045']);
  });
});
