/** OP16-076 The Three Admirals!!. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  game,
  passBlock,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { ADMIRAL_A, ADMIRAL_B, ADMIRAL_C, defend, NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-076';
const start = () =>
  game(
    {
      leader: NOT_NAVY,
      hand: [ID],
      characters: [ADMIRAL_A, ADMIRAL_B, ADMIRAL_C, V.c4],
      costArea: { active: 4, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('OP16-076 The Three Admirals!!', () => {
  it('[Main] rest 3 DON!!: up to 3 {Admiral} Characters gain +2000 power this turn', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    pick(g, [
      g.find('p1', 'characters', ADMIRAL_A),
      g.find('p1', 'characters', ADMIRAL_B),
      g.find('p1', 'characters', ADMIRAL_C),
    ]);
    for (const a of [ADMIRAL_A, ADMIRAL_B, ADMIRAL_C])
      expect(g.power(g.find('p1', 'characters', a))).toBe(10000);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
  });

  it('only {Admiral} Characters can be chosen, and "up to 3" may be fewer', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    const vanilla = g.find('p1', 'characters', V.c4);
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === vanilla)).toBe(false);
    pick(g, [g.find('p1', 'characters', ADMIRAL_A)]);
    expect(g.power(g.find('p1', 'characters', ADMIRAL_A))).toBe(10000);
    expect(g.power(g.find('p1', 'characters', ADMIRAL_B))).toBe(8000);
  });

  it('declining the optional DON!! cost does nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.power(g.find('p1', 'characters', ADMIRAL_A))).toBe(8000);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1 });
  });

  it('[Counter] with an {Admiral} Character: your Leader or Character gains +4000 power', () => {
    const g = defend({
      leader: NOT_NAVY,
      hand: [ID],
      characters: [ADMIRAL_A],
      costArea: { active: 1, rested: 0 },
    });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('[Counter] with no {Admiral} Character nothing is gained', () => {
    const g = defend({
      leader: NOT_NAVY,
      hand: [ID],
      characters: [V.c4],
      costArea: { active: 1, rested: 0 },
    });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
