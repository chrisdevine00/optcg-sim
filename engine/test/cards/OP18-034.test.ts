/** OP18-034 Franky. */
import { describe, expect, it } from 'vitest';
import { candidates } from './helpers-a10g1.ts';
import { expectDecision, game, none, pick, play, V } from './helpers.ts';
import {
  FF2,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  SHC3,
  SHC6,
  STAGE2,
  STAGE5,
  STAGE6,
  W7,
} from './helpers-op18.ts';

const ID = 'OP18-034';
const start = (hand: string[], opts: { stage?: string; chars?: string[] } = {}) => {
  const g = game(
    {
      leader: PLAIN_PURPLE,
      hand: [ID, ...hand],
      costArea: { active: 6, rested: 0 },
      ...(opts.stage ? { stage: opts.stage } : {}),
    },
    { leader: PLAIN_BLUE, characters: opts.chars ?? [V.c6, V.c7] },
  );
  play(g, ID);
  return g;
};

describe('OP18-034 Franky', () => {
  it('[On Play] plays a {The Franky Family} or {Straw Hat Crew} card with a cost of 5 or less from hand', () => {
    const g = start([FF2, SHC3, SHC6, W7]);
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'hand', FF2), g.find('p1', 'hand', SHC3)].sort(),
    );
    pick(g, [g.find('p1', 'hand', SHC3)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, SHC3]);
  });

  it('a Stage it plays counts: a cost 5 Stage then rests a cost 6 or less Character', () => {
    const g = start([STAGE5].map(() => 'OP18-075'));
    pick(g, [g.find('p1', 'hand', 'OP18-075')]);
    // Thousand Sunny's own [On Play] (draw, DON!!) resolves first or after; settle choices.
    while (g.decider === 'p1' && g.legal().some((a) => a.type === 'pick')) {
      const c = candidates(g);
      const t = g.find('p2', 'characters', V.c6);
      if (c.includes(t)) {
        pick(g, [t]);
        break;
      }
      const opt = g.legal().find((a) => a.type === 'pick');
      g.act(opt!);
    }
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
  });

  it('with a cost 5 Stage already on the field it rests; a cost 7 Character cannot be chosen', () => {
    const g = start([], { stage: STAGE5 });
    if (candidates(g).length === 0) none(g);
    expect(candidates(g)).toEqual([g.find('p2', 'characters', V.c6)]);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
  });

  it('without a Stage of cost 5 or more nothing is rested (a cost 2 Stage is not enough)', () => {
    const g = start([], { stage: STAGE2 });
    if (
      g.decider === 'p1' &&
      candidates(g).length === 0 &&
      g.legal().some((a) => a.type === 'done')
    )
      none(g);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
    expectDecision(g, 'main', 'p1');
  });

  it('a cost 6 Stage in hand is not playable by it', () => {
    const g = start([STAGE6]);
    expect(candidates(g)).not.toContain(g.find('p1', 'hand', STAGE6));
  });
});
