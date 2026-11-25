/** OP10-040 The Weak Do Not Have the Right to Choose How They Die. */
import type { PlayerSpec } from '@optcg/engine';
import { describe, expect, it } from 'vitest';
import { dec, endCounter, none, pick, play, trash, V } from './helpers.ts';
import { canPick, cardsOf, COST8, counterGame, finish, start } from './helpers-a10g4.ts';

const ID = 'OP10-040';
const rested = (card: string) => ({ card, rested: true });

const main = (oppChars: NonNullable<PlayerSpec['characters']>) =>
  start({ hand: [ID] }, { characters: oppChars });

describe('OP10-040 The Weak Do Not Have the Right to Choose How They Die', () => {
  it('[Main]: K.O. a rested Character with a cost of 7 or less (boundary 7); active and cost 8 are not eligible', () => {
    const g = main([rested(V.c7), rested(COST8), V.c3, rested(V.c1)]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', COST8))).toBe(false); // cost 8
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // active
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([COST8, V.c3, V.c1]);
    expect(trash(g, 'p2')).toEqual([V.c7]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('"up to 1": may K.O. nothing; with no rested Character nothing is asked', () => {
    const g = main([rested(V.c4)]);
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c4]);
    const h = main([V.c4, V.c5]);
    play(h, ID);
    expect(dec(h)?.kind).not.toBe('choose');
    expect(cardsOf(h, 'p2', 'characters')).toEqual([V.c4, V.c5]);
  });

  it('must not K.O. your own rested Characters', () => {
    const g = start({ hand: [ID], characters: [rested(V.c2)] }, { characters: [rested(V.c3)] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
  });

  it('[Counter]: K.O. the rested attacker (it rested to attack) and the Leader takes no damage', () => {
    const g = counterGame(
      ID,
      { costArea: { active: 5, rested: 0 } },
      { characters: [V.c3] },
      true,
      V.c7,
      'main',
    );
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(true); // the attacker, cost 7, rested
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // active
    pick(g, [g.find('p2', 'characters', V.c7)]);
    if (dec(g)?.kind === 'counter') endCounter(g);
    finish(g);
    expect(g.life('p1')).toBe(3);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c3]);
  });
});
