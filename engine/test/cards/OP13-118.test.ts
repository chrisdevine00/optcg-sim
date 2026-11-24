/** OP13-118 Monkey.D.Luffy (Character). */
import { describe, expect, it } from 'vitest';
import { don, game, option, play, setMost, V } from './helpers.ts';
import { PLAIN_BLUE, PLAIN_PURPLE, RGL } from './helpers-rgl-penel.ts';

const canPlay = (g: ReturnType<typeof game>, card: string) =>
  g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', card), player: 'p1' });

describe('OP13-118 Monkey.D.Luffy', () => {
  it('[Double Attack] is a printed keyword', () => {
    const g = game({ leader: RGL, characters: ['OP13-118'] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', 'OP13-118')).keywords).toContain('Double Attack');
  });

  it('[On Play] with a multicolored Leader: sets up to 4 DON!! active, then Characters with a base cost of 5+ cannot be played this turn', () => {
    const g = game(
      { leader: RGL, hand: ['OP13-118', V.c5, V.c4], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP13-118');
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 8, rested: 2 });
    expect(canPlay(g, V.c5)).toBe(false); // affordable (8 active) but barred
    expect(canPlay(g, V.c4)).toBe(true);
  });

  it('the restriction ends with the turn', () => {
    const g = game(
      { leader: RGL, hand: ['OP13-118', V.c5], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP13-118');
    setMost(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canPlay(g, V.c5)).toBe(true);
  });

  it('"up to 4": choosing 1 sets one; the restriction still applies (OP14-R2)', () => {
    const g = game(
      { leader: RGL, hand: ['OP13-118', V.c5, V.c4], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP13-118');
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
    expect(canPlay(g, V.c5)).toBe(false);
  });

  it('with a Leader that is not multicolored nothing happens, and the "Then" restriction is skipped with the guard (CR 4-10-1)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: ['OP13-118', V.c4], costArea: { active: 6, rested: 4 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP13-118');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 10 });
    expect(canPlay(g, V.c4)).toBe(false); // no DON!!, not a restriction
  });
});
