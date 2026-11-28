/** OP18-058 This Kingdom is Doomed. You Can't Save It!. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  hand,
  passBlock,
  pick,
  play,
  V,
} from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { game, PLAIN_BLUE, PLAIN_PURPLE } from './helpers.ts';
import { mine } from './helpers-op18-g3.ts';

const ID = 'OP18-058';
const start = (own: string[] = [V.c2, V.c3]) =>
  mine({ hand: [ID], characters: own }, { characters: [V.c4, V.c5] });

describe("OP18-058 This Kingdom is Doomed. You Can't Save It!", () => {
  it("[Main] return 1 of your Characters to the hand: place up to 1 Character with a cost of 4 or less at the bottom of its owner's deck", () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'characters', V.c3), g.find('p2', 'characters', V.c4)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.zone('p2', 'deck').at(-1)!.card).toBe(V.c4);
    expect(g.zone('p2', 'deck')).toHaveLength(11);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c5]);
  });

  it('a Character with a cost of 5 cannot be chosen, and the returned Character is no longer a target', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(candidates(g)).not.toContain(g.find('p2', 'characters', V.c5));
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3]);
  });

  it('"up to 1": may place nothing after returning the Character', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    g.act({ type: 'done' });
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('declining the cost does nothing; with no Character of yours the cost cannot be paid', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    const empty = start([]);
    play(empty, ID);
    expect(empty.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });

  it('[Trigger] activates the [Main] effect', () => {
    const g = game(
      { leader: PLAIN_PURPLE, life: [ID, BLUE, BLUE], characters: [V.c2] },
      { leader: PLAIN_BLUE, characters: [V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    accept(g); // the only Character of yours is returned without a choice
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.zone('p2', 'deck').at(-1)!.card).toBe(V.c4);
    expect(hand(g, 'p1')).toContain(V.c2);
  });
});
