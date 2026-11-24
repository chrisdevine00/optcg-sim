/** EB04-057 Vegapunk: with 2 or less Life, all your yellow {Scientist} Characters cannot be removed from the field by your opponent's effects; [DON!! x1] this Character gains [Blocker]. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE, V } from './helpers.ts';
import { ids, koNow, OTHER_LEADER, SCIENTIST5 } from './helpers-eb04g2.ts';

const ID = 'EB04-057';
const PURPLE_SCIENTIST = 'ST05-015'; // Dr. Indigo, {Scientist}, not yellow

const setup = (life: string[], chars: (string | { card: string; don: number })[] = []) =>
  game(
    { leader: OTHER_LEADER, characters: [ID, ...chars], life, costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('EB04-057 Vegapunk', () => {
  it("with 2 Life a yellow {Scientist} Character is not K.O.'d by an opposing effect (Vegapunk itself and [Shaka])", () => {
    const g = setup([V.c1, V.c1], [SCIENTIST5]);
    koNow(g, 'p1', SCIENTIST5, 'p2');
    koNow(g, 'p1', ID, 'p2');
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, SCIENTIST5].sort());
  });

  it('boundary: with 3 Life they can be removed', () => {
    const g = setup([V.c1, V.c1, V.c1], [SCIENTIST5]);
    koNow(g, 'p1', SCIENTIST5, 'p2');
    koNow(g, 'p1', ID, 'p2');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('with 0 Life they are protected too', () => {
    const g = setup([], [SCIENTIST5]);
    koNow(g, 'p1', SCIENTIST5, 'p2');
    expect(ids(g, 'p1', 'characters')).toContain(SCIENTIST5);
  });

  it('a {Scientist} that is not yellow, and a yellow Character that is not {Scientist}, are not protected', () => {
    const g = setup([V.c1], [PURPLE_SCIENTIST, 'OP03-101']);
    koNow(g, 'p1', PURPLE_SCIENTIST, 'p2');
    koNow(g, 'p1', 'OP03-101', 'p2'); // yellow {Merfolk}
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('only opposing effects are stopped: your own effect can still K.O. your Scientist', () => {
    const g = setup([V.c1], [SCIENTIST5]);
    koNow(g, 'p1', SCIENTIST5, 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('[DON!! x1] gains [Blocker] with 1 DON!! given, not without', () => {
    const none = setup([V.c1]);
    expect(none.card(none.find('p1', 'characters', ID)).keywords).not.toContain('Blocker');
    const g = game(
      {
        leader: OTHER_LEADER,
        characters: [{ card: ID, don: 1 }],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('the [Blocker] needs no Life condition (3 Life, 1 DON!! given)', () => {
    const g = game(
      {
        leader: OTHER_LEADER,
        characters: [{ card: ID, don: 1 }],
        life: [V.c1, V.c1, V.c1],
        costArea: { active: 4, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
