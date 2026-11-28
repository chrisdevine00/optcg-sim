/** OP18-045 Mr.Prince. */
import { describe, expect, it } from 'vitest';
import { game, play, times } from './helpers.ts';
import { candidates, EVENT, PLAIN_BLUE, PLAIN_PURPLE } from './helpers-op18-g2.ts';

const ID = 'OP18-045';
const withEvents = (n: number) =>
  game({ leader: PLAIN_PURPLE, characters: [ID], trash: times(n, EVENT) }, { leader: PLAIN_BLUE });

describe('OP18-045 Mr.Prince', () => {
  it('gains +1000 power for every 5 Events in your trash', () => {
    const g = withEvents(5);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
    const h = withEvents(10);
    expect(h.power(h.find('p1', 'characters', ID))).toBe(6000);
  });

  it('4 Events are not enough; 9 give only +1000', () => {
    const g = withEvents(4);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
    const h = withEvents(9);
    expect(h.power(h.find('p1', 'characters', ID))).toBe(5000);
  });

  it('only Events count, only in your own trash', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID], trash: times(5, 'OP02-084') },
      { leader: PLAIN_BLUE, trash: times(5, EVENT) },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
  });

  it('is also named [Sanji] according to the rules: a search for [Sanji] finds it', () => {
    const g = game(
      {
        leader: 'OP12-041',
        hand: ['EB04-029'],
        deck: [ID, 'OP02-084', 'OP02-084'],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'EB04-029');
    expect(candidates(g)).toContain(g.find('p1', 'deck', ID));
    expect(candidates(g)).not.toContain(g.find('p1', 'deck', 'OP02-084'));
  });
});
