/** EB05-049 Special Hollow: [Main] You may K.O. 1 of your {Thriller Bark Pirates} type Characters: Give up to 1 of your opponent's Characters -3 cost during this turn. [Counter] You may K.O. 1 of your {Thriller Bark Pirates} type Characters: Up to 1 of your Leader or Characters gains +4000 power during this battle. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  play,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { ids } from './helpers-robin.ts';

const HOLLOW = 'EB05-049';
/** OP06-094 Lola: a vanilla {Thriller Bark Pirates} Character, cost 4. */
const TB = 'OP06-094';

describe('EB05-049 Special Hollow', () => {
  const main = (chars: string[], opp: string[]) => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [HOLLOW],
        characters: chars,
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_PURPLE, characters: opp },
    );
    play(g, HOLLOW);
    return g;
  };

  it('[Main] K.O. a Thriller Bark Pirates Character of yours: the chosen opposing Character gets -3 cost this turn', () => {
    const g = main([TB, V.c1], [V.c4, V.c6]);
    accept(g);
    expect(ids(g, 'p1', 'trash')).toContain(TB);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(1);
    expect(g.card(g.find('p2', 'characters', V.c6)).cost).toBe(6);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(4);
  });

  it('[Main] "up to 1": may choose no target (the cost is still paid)', () => {
    const g = main([TB], [V.c4]);
    accept(g);
    none(g);
    expect(ids(g, 'p1', 'trash')).toContain(TB);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(4);
  });

  it('[Main] the cost may be declined: nothing is K.O.ed', () => {
    const g = main([TB], [V.c4]);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([TB]);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(4);
  });

  it('[Main] cannot be paid without a {Thriller Bark Pirates} Character of yours', () => {
    const g = main([V.c1], [V.c4]);
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });

  it('[Counter] K.O. a Thriller Bark Pirates Character: your Leader gains +4000 power during this battle', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [HOLLOW],
        characters: [TB],
        costArea: { active: 1, rested: 0 },
        life: [V.c1, V.c1],
      },
      { leader: PLAIN_PURPLE, characters: [V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', HOLLOW), ability: 'counter' });
    accept(g);
    expect(ids(g, 'p1', 'trash')).toContain(TB);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(2);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
