/** OP15-075 El Thor. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  payDon,
  pick,
  play,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { counterStep, ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP15-075 El Thor', () => {
  const start = (leader: string) =>
    game(
      {
        leader,
        hand: ['OP15-075'],
        characters: [V.c3],
        costArea: { active: 2, rested: 0 },
        donDeck: leader === ENEL ? 4 : 8,
      },
      { leader: PLAIN_BLUE, characters: [V.c1, V.c2] },
    );

  it('[Main] DON!! -1: with an [Enel] Leader a Leader or Character gains +1000 this turn, then K.O. up to 1 Character with 3000 power or less', () => {
    const g = start(ENEL);
    play(g, 'OP15-075');
    accept(g);
    payDon(g);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    // Only the 3000-power Character is a legal K.O. target (the other has 4000).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c2]);
    expect(g.power(g.leader('p1'))).toBe(6000); // until the end of the turn
  });

  it('may be declined: nothing happens and no DON!! is returned', () => {
    const g = start(ENEL);
    play(g, 'OP15-075');
    decline(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').deck).toBe(4);
  });

  it('without an [Enel] Leader neither the boost nor the K.O. happens', () => {
    const g = start(PLAIN_PURPLE);
    play(g, 'OP15-075');
    accept(g);
    payDon(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expectDecision(g, 'main', 'p1');
  });

  it('with no Character of 3000 power or less the +1000 still applies', () => {
    const g = game(
      { leader: ENEL, hand: ['OP15-075'], costArea: { active: 2, rested: 0 }, donDeck: 4 },
      { leader: PLAIN_BLUE, characters: [V.c2] },
    );
    play(g, 'OP15-075');
    accept(g);
    payDon(g);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('[Counter]: up to 1 of your [Enel] cards gains +2000 power during this battle', () => {
    const g = counterStep({ leader: ENEL, hand: ['OP15-075'], characters: [V.c3], donDeck: 6 });
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP15-075'), ability: 'counter' });
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });
});
