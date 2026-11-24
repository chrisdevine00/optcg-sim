/** OP17-022 Shanks. */
import { describe, expect, it } from 'vitest';
import { don, game, option, play, setMost, V } from './helpers.ts';
import { PLAIN_BLUE, RGL } from './helpers-rgl-penel.ts';

describe('OP17-022 Shanks', () => {
  const setup = () =>
    game(
      { leader: RGL, hand: ['OP17-022'], costArea: { active: 10, rested: 0 } },
      {
        leader: PLAIN_BLUE,
        characters: [V.c3, { card: V.c5, rested: true }, V.c7],
      },
    );

  it("[On Play]: sets up to 2 DON!! active, then rests all of the opponent's Characters", () => {
    const g = setup();
    play(g, 'OP17-022');
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
    for (const c of g.zone('p2', 'characters')) expect(c.rested).toBe(true);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('"up to 2": choosing 0 sets none, the opponent\'s Characters are still rested (OP14-R2)', () => {
    const g = setup();
    play(g, 'OP17-022');
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 10 });
    for (const c of g.zone('p2', 'characters')) expect(c.rested).toBe(true);
  });

  it('[Rush]: it can attack the turn it is played', () => {
    const g = setup();
    const id = play(g, 'OP17-022');
    setMost(g);
    expect(g.isLegal({ type: 'attack', attacker: id, target: g.leader('p2'), player: 'p1' })).toBe(
      true,
    );
  });
});
