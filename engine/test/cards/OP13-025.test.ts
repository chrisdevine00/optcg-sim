/** OP13-025 Koby. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, option, play, setMost } from './helpers.ts';
import { FILM_LEADER, mine, OTHER_LEADER, SUPERNOVAS_LEADER, ZORO_LEADER } from './helpers-lfa.ts';

const ID = 'OP13-025';

/** p1 plays Koby (cost 5) over `leader` with 5 active and `rested` rested DON!!. */
const run = (leader: string, rested = 2) => {
  const g = mine(leader, { hand: [ID] }, {}, 5, rested);
  play(g, ID);
  return g;
};

describe('OP13-025 Koby', () => {
  it('[On Play] with a <Strike> Leader: set up to 1 of your DON!! cards as active', () => {
    const g = run(SUPERNOVAS_LEADER);
    expectDecision(g, 'choose', 'p1');
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 6 });
  });

  it('with a {FILM} Leader that is not <Strike> it works too (either is enough)', () => {
    // OP06-001 is {FILM} <Special>.
    const g = run(FILM_LEADER);
    expectDecision(g, 'choose', 'p1');
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 6 });
  });

  it('"up to 1": it can set none', () => {
    const g = run(SUPERNOVAS_LEADER);
    const opts = dec(g)!.options!;
    expect(opts.length).toBe(2);
    option(g, opts[opts.length - 1]!.id);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
  });

  it('must not apply with a Leader that is neither {FILM} nor <Strike>: nothing is asked and nothing is set', () => {
    // ST03-001 is <Special>, OP01-001 is <Slash> and {Straw Hat Crew} {Supernovas}: neither FILM nor Strike.
    for (const leader of [OTHER_LEADER, ZORO_LEADER]) {
      const g = run(leader);
      expectDecision(g, 'main', 'p1');
      expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    }
  });

  it('has [Blocker]', () => {
    const g = mine(OTHER_LEADER, { characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});
