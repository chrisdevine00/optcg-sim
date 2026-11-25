/** EB03-051 Charlotte Smoothie. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
  PURPLE,
  V,
} from './helpers.ts';
import { canPick } from './helpers-w5c1.ts';

const ID = 'EB03-051';
type Life = (string | { card: string; faceUp?: boolean })[];
const start = (life: Life, opp: string[] = [V.c2]) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID], life, costArea: { active: 3, rested: 0 } },
    { leader: PLAIN_BLUE, characters: opp },
  );
const faces = (g: ReturnType<typeof start>) => g.zone('p1', 'life').map((c) => c.faceUp);
const up = (card: string) => ({ card, faceUp: true });

describe('EB03-051 Charlotte Smoothie', () => {
  it('[On Play] with a face-up Life card: K.O. up to 1 opposing Character cost 2 or less, then every Life card is turned face-down', () => {
    const g = start([up(BLUE), BLUE, up(PURPLE)]);
    expect(faces(g)).toEqual([true, false, true]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(faces(g)).toEqual([false, false, false]);
    expect(dec(g)?.kind).toBe('main');
  });

  it("boundary: cost 2 can be K.O.'d, cost 3 and the Leader cannot", () => {
    const g = start([up(BLUE)], [V.c2, V.c3]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });

  it('"up to 1": choosing none still turns the Life cards face-down (it is not "if you do")', () => {
    const g = start([up(BLUE), up(BLUE)]);
    play(g, ID);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(faces(g)).toEqual([false, false]);
  });

  it("must not fire with no face-up Life card: nothing is K.O.'d and no question is asked", () => {
    const g = start([BLUE, BLUE, BLUE]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(faces(g)).toEqual([false, false, false]);
  });

  it('with no Life at all it does nothing either', () => {
    const g = start([]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('a face-up card deep in the Life area counts, and only face-up cards were turned', () => {
    const g = start([BLUE, BLUE, up(BLUE)]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(faces(g)).toEqual([false, false, false]);
  });
});
