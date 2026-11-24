/** OP16-063 Kuzan. */
import { describe, expect, it } from 'vitest';
import {
  addMost,
  don,
  expectDecision,
  game,
  none,
  passBlock,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { MOMO_9, NAVY_LEADER } from './helpers-op16g3.ts';

const ID = 'OP16-063';
const canBlock = (g: ReturnType<typeof game>, blocker: string) =>
  g.legal().some((a) => a.type === 'block' && a.blocker === blocker);

describe('OP16-063 Kuzan', () => {
  it('[On Play] adds up to 2 DON!! from the DON!! deck, rested', () => {
    const g = game(
      { leader: NAVY_LEADER, hand: [ID], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 9, deck: 1 });
  });

  const attackWith = (use: boolean) => {
    const g = game(
      { leader: NAVY_LEADER, characters: [ID, V.c4], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [MOMO_9] },
    );
    if (use) {
      g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'no-block' });
      payDon(g);
      pick(g, [g.find('p2', 'characters', MOMO_9)]);
    }
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c4), target: g.leader('p2') });
    return g;
  };

  it('DON!! -1: the chosen Character cannot activate [Blocker] this turn', () => {
    const g = attackWith(true);
    expect(don(g, 'p1')).toMatchObject({ deck: 9 });
    const momo = g.find('p2', 'characters', MOMO_9);
    expect(canBlock(g, momo)).toBe(false);
    passBlock(g);
  });

  it('without the activation the same Blocker may block', () => {
    const g = attackWith(false);
    expectDecision(g, 'block', 'p2');
    expect(canBlock(g, g.find('p2', 'characters', MOMO_9))).toBe(true);
  });

  it('"up to 1": choosing nobody still pays DON!! -1 and the Blocker still blocks', () => {
    const g = game(
      { leader: NAVY_LEADER, characters: [ID, V.c4], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [MOMO_9] },
    );
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'no-block' });
    payDon(g);
    none(g);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c4), target: g.leader('p2') });
    expect(canBlock(g, g.find('p2', 'characters', MOMO_9))).toBe(true);
  });

  it('Once Per Turn', () => {
    const g = game(
      { leader: NAVY_LEADER, characters: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [MOMO_9] },
    );
    const kuzan = g.find('p1', 'characters', ID);
    g.act({ type: 'activate', card: kuzan, ability: 'no-block' });
    payDon(g);
    none(g);
    expect(g.isLegal({ type: 'activate', card: kuzan, ability: 'no-block', player: 'p1' })).toBe(
      false,
    );
  });
});
