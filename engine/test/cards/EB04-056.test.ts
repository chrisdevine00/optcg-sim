/** EB04-056 Pacifista: if you have [Jewelry Bonney] and you have 0 Life cards, this Character gains [Blocker]. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE, V } from './helpers.ts';
import { OTHER_LEADER } from './helpers-eb04g2.ts';

const ID = 'EB04-056';
const BONNEY = 'EB02-015'; // Jewelry Bonney Character (its [On Play] is inert once placed)
const BONNEY_LEADER = 'EB04-001'; // Jewelry Bonney Leader

const setup = (leader: string, chars: string[], life: string[], oppChars: string[] = []) =>
  game({ leader, characters: [ID, ...chars], life }, { leader: PLAIN_BLUE, characters: oppChars });
const blocker = (g: ReturnType<typeof setup>) =>
  g.card(g.find('p1', 'characters', ID)).keywords.includes('Blocker');

describe('EB04-056 Pacifista', () => {
  it('has no [Blocker] of its own', () => {
    const g = setup(OTHER_LEADER, [], [V.c1]);
    expect(blocker(g)).toBe(false);
  });

  it('with a [Jewelry Bonney] Character and 0 Life it gains [Blocker]', () => {
    const g = setup(OTHER_LEADER, [BONNEY], []);
    expect(blocker(g)).toBe(true);
  });

  it('a [Jewelry Bonney] Leader counts too', () => {
    const g = setup(BONNEY_LEADER, [], []);
    expect(blocker(g)).toBe(true);
  });

  it('boundary: with 1 Life it does not', () => {
    const g = setup(OTHER_LEADER, [BONNEY], [V.c1]);
    expect(blocker(g)).toBe(false);
  });

  it('without [Jewelry Bonney] it does not, even with 0 Life', () => {
    const g = setup(OTHER_LEADER, [V.c3], []);
    expect(blocker(g)).toBe(false);
  });

  it("the opponent's [Jewelry Bonney] does not count", () => {
    const g = setup(OTHER_LEADER, [], [], [BONNEY]);
    expect(blocker(g)).toBe(false);
  });
});
