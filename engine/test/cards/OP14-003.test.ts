/** OP14-003 Capone"Gang"Bege. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { PLAIN_BLUE, PLAIN_PURPLE, V, endCounter, game, passBlock } from './helpers.ts';
import { buff } from './helpers-op11g1.ts';
import { mine } from './helpers-w5c2.ts';

const ID = 'OP14-003';
/** Purple vanillas by base power: V.c2 4000, V.c3 5000, V.c4 6000. */
const koFrom = (owner: 'you' | 'opponent'): Ability =>
  ({
    id: 'k',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do: {
          ko: {
            from: 'characters',
            owner,
            filter: { name: 'Capone"Gang"Bege' },
            pick: { exactly: 1 },
          },
        },
      },
    ],
  }) as Ability;

/** p2's turn: p2's `src` card (or its Leader) K.O.s p1's Bege; `prep` may change the source first. */
const byEffect = (
  src: string | 'leader',
  prep: (g: ReturnType<typeof game>) => void = () => {},
) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [ID] },
    { leader: PLAIN_BLUE, characters: src === 'leader' ? [] : [src] },
    { activePlayer: 'p2', turn: 4 },
  );
  prep(g);
  if (src === 'leader') {
    g.state = withAbilities(g.state, PLAIN_BLUE, [koFrom('opponent')]);
    g.act({ type: 'activate', card: g.leader('p2'), ability: 'k' });
  } else {
    g.state = withAbilities(g.state, src, [koFrom('opponent')]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', src), ability: 'k' });
  }
  return g;
};
const survives = (g: ReturnType<typeof byEffect>) => g.zone('p1', 'characters').length === 1;

describe('OP14-003 Capone"Gang"Bege', () => {
  it("an opponent's Character with 5000 base power cannot K.O. it; 6000 can (boundary)", () => {
    const stopped = byEffect(V.c3);
    expect(survives(stopped)).toBe(true);
    expect(stopped.eventsOfType('KOPrevented')).toHaveLength(1);
    expect(survives(byEffect(V.c2))).toBe(true);
    expect(survives(byEffect(V.c4))).toBe(false);
  });

  it('reads base power: a buffed 4000 is still stopped, a debuffed 6000 still K.O.s', () => {
    expect(
      survives(byEffect(V.c2, (g) => buff(g, g.find('p2', 'characters', V.c2), 3000, 'p2', 4))),
    ).toBe(true);
    expect(
      survives(byEffect(V.c4, (g) => buff(g, g.find('p2', 'characters', V.c4), -3000, 'p1', 4))),
    ).toBe(false);
  });

  it("an effect of the opponent's Leader is not an effect of a Character: it K.O.s it", () => {
    expect(survives(byEffect('leader'))).toBe(false);
  });

  it('your own effect (a 5000 Character of yours) still K.O.s it', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID, V.c3] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, V.c3, [koFrom('you')]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c3), ability: 'k' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3]);
  });

  it('a battle K.O. is not an effect: a bigger attacker K.O.s it', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: mine(g, ID) });
    passBlock(g);
    endCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
