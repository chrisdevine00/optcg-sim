/** OP15-112 Raki: [Blocker]; [On Play] play a {Shandian Warrior} Character with cost 3 or less. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE } from './helpers.ts';
import { GENBO, HOLLY, KAL, SETO } from './helpers-kalgara.ts';

const position = () =>
  game(
    {
      leader: KAL,
      hand: ['OP15-112', SETO, HOLLY, GENBO],
      costArea: { active: 4, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );

describe('OP15-112 Raki', () => {
  it('has [Blocker]', () => {
    const g = position();
    play(g, 'OP15-112');
    none(g);
    expect(g.card(g.find('p1', 'characters', 'OP15-112')).keywords).toContain('Blocker');
  });

  it('[On Play] offers only {Shandian Warrior} Characters with cost 3 or less', () => {
    const g = position();
    play(g, 'OP15-112');
    expectDecision(g, 'choose', 'p1');
    // Seto (cost 5) and Holly (not a Shandian Warrior) are not offered.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', GENBO)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual(['OP15-112', GENBO].sort());
    expect(
      g
        .zone('p1', 'hand')
        .map((c) => c.card)
        .sort(),
    ).toEqual([HOLLY, SETO].sort());
  });

  it('"up to 1": the player may play nothing', () => {
    const g = position();
    play(g, 'OP15-112');
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});
