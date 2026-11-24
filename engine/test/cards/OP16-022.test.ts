/** OP16-022 Monkey.D.Luffy (Leader). */
import { describe, expect, it } from 'vitest';
import { don, game, option, PLAIN_BLUE, setMost, V } from './helpers.ts';
import { canActivate, IMPEL_G, IMPEL_V, OP16_022 } from './helpers-op16g1.ts';

const ID = OP16_022;

describe('OP16-022 Monkey.D.Luffy', () => {
  const start = (chars: Parameters<typeof game>[0]['characters'], rested = 3) =>
    game(
      { leader: ID, characters: chars, costArea: { active: 0, rested } },
      { leader: PLAIN_BLUE },
    );
  const act = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'set-don' });

  it('[Activate: Main] if the only Characters on your field are {Impel Down} Characters: set up to 2 of your DON!! as active', () => {
    const g = start([IMPEL_V, IMPEL_G]);
    act(g);
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('with a Character that is not {Impel Down} the ability cannot be activated', () => {
    const g = start([IMPEL_V, V.c4]);
    expect(canActivate(g, g.leader('p1'), 'set-don')).toBe(false);
  });

  it('with no Characters at all the condition is false, so it cannot be activated (E-Q4; review OP16-R1)', () => {
    const g = start([]);
    expect(canActivate(g, g.leader('p1'), 'set-don')).toBe(false);
  });

  it('"up to 2": with only 1 rested DON!! it sets 1', () => {
    const g = start([IMPEL_V], 1);
    act(g);
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 0 });
  });

  it('"up to 2": a count is asked; 0 sets none (OP14-R2)', () => {
    const g = start([IMPEL_V]);
    act(g);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
  });

  it('is Once Per Turn', () => {
    const g = start([IMPEL_V]);
    act(g);
    setMost(g);
    expect(canActivate(g, g.leader('p1'), 'set-don')).toBe(false);
  });
});
