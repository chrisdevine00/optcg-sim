/** OP18-040 Diable Jambe Flambe Shot. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, passBlock, endCounter } from './helpers.ts';
import { candidates, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers-op18-g2.ts';

const ID = 'OP18-040';
const C8 = 'EB02-004'; // cost 8
const main = (chars: unknown[]) => {
  const g = game(
    { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 4, rested: 0 } },
    { leader: PLAIN_BLUE, characters: chars as string[] },
  );
  play(g, ID);
  return g;
};

describe('OP18-040 Diable Jambe Flambe Shot', () => {
  it('[Main] K.O.s a rested Character with a cost of 7 or less; active, cost 8 and rested cost 8 are not offered', () => {
    const g = main([{ card: V.c7, rested: true }, { card: C8, rested: true }, V.c3]);
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g)).toEqual([g.find('p2', 'characters', V.c7)]);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C8, V.c3]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c7]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = main([{ card: V.c3, rested: true }]);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('no rested Character: nothing to choose', () => {
    const g = main([V.c3]);
    expect(candidates(g)).toEqual([]);
  });

  const trig = (chars: string[]) => {
    const g = game(
      { leader: PLAIN_PURPLE, life: [ID, V.c1, V.c1] },
      { leader: PLAIN_BLUE, characters: [V.c7, ...chars] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    return g;
  };

  it('[Trigger] rests up to 1 of the opponent Characters with a cost of 7 or less', () => {
    const g = trig([C8, V.c3]);
    expect(candidates(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c7), g.find('p2', 'characters', V.c3)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it('[Trigger]: a cost 8 Character cannot be chosen', () => {
    const g = trig([C8]);
    expect(candidates(g)).not.toContain(g.find('p2', 'characters', C8));
  });
});
