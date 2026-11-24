/** OP12-033 Helmeppo ([Blocker]). */
import { describe, expect, it } from 'vitest';
import { dec, game, none, passBlock, pick, PLAIN_BLUE, V } from './helpers.ts';
import { at, choices, isRested } from './helpers-op12g1.ts';

const ID = 'OP12-033';

describe('OP12-033 Helmeppo', () => {
  /** p2 attacks p1's Leader with an 8000 Character (V.c6); p2 also has `others`. */
  const attack = (others: string[] = [V.c5, V.c3]) => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c6, ...others] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    return g;
  };
  const block = (g: ReturnType<typeof attack>) =>
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', ID) });

  it('has [Blocker] (printed)', () => {
    const g = attack();
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Block]: rests up to 1 opposing Character with cost 5 or less (cost 6 is not offered)', () => {
    const g = attack();
    block(g);
    // The attacker (cost 6) is out; cost 5 and cost 3 are on offer.
    expect(choices(g).sort()).toEqual(
      [at(g, 'p2', 'characters', V.c5), at(g, 'p2', 'characters', V.c3)].sort(),
    );
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    expect(isRested(g, at(g, 'p2', 'characters', V.c5))).toBe(true);
    expect(isRested(g, at(g, 'p2', 'characters', V.c3))).toBe(false);
  });

  it('"up to 1": may be skipped', () => {
    const g = attack();
    block(g);
    none(g);
    expect(isRested(g, at(g, 'p2', 'characters', V.c5))).toBe(false);
  });

  it('with no eligible Character nothing is asked', () => {
    const g = attack([V.c7]);
    block(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('must not fire when Helmeppo does not block', () => {
    const g = attack();
    passBlock(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(dec(g)?.kind).toBe('counter');
    expect(isRested(g, at(g, 'p2', 'characters', V.c5))).toBe(false);
  });
});
