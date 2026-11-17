/** ST21-003 Sanji. "Cannot activate [Blocker]" is not [Unblockable] (DECISIONS 2026-11-16). */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, play, V } from './helpers.ts';
import { BLOCKER, EAST_BLUE, PLAIN_BLUE, RGL, SHC3, SHC6, SHC8 } from './helpers-rgl-penel.ts';

const setup = () =>
  game(
    {
      leader: RGL,
      hand: ['ST21-003'],
      characters: [SHC6, SHC8, SHC3, EAST_BLUE],
      costArea: { active: 2, rested: 0 },
    },
    { leader: PLAIN_BLUE, characters: [BLOCKER, V.c1] },
  );

describe('ST21-003 Sanji', () => {
  it('[On Play] offers only {Straw Hat Crew} Characters with 6000 power or more', () => {
    const g = setup();
    play(g, 'ST21-003');
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered.map((a) => (a.type === 'pick' ? a.choice : null)).sort()).toEqual(
      [g.find('p1', 'characters', SHC6), g.find('p1', 'characters', SHC8)].sort(),
    );
  });

  it('the selected Character attacks and the opponent cannot activate [Blocker]', () => {
    const g = setup();
    play(g, 'ST21-003');
    pick(g, [g.find('p1', 'characters', SHC6)]);
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', SHC6),
      target: g.leader('p2'),
    });
    // The only block action left is "do not block".
    expectDecision(g, 'block', 'p2');
    expect(g.legal().filter((a) => a.type === 'block' && a.blocker !== null)).toEqual([]);
  });

  it('a Character that was not selected can still be blocked', () => {
    const g = setup();
    play(g, 'ST21-003');
    pick(g, [g.find('p1', 'characters', SHC6)]);
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', SHC8),
      target: g.leader('p2'),
    });
    expectDecision(g, 'block', 'p2');
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p2', 'characters', BLOCKER), player: 'p2' }),
    ).toBe(true);
  });

  it('selecting nothing ("up to 1") restricts nobody', () => {
    const g = setup();
    play(g, 'ST21-003');
    g.act({ type: 'done' });
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', SHC6),
      target: g.leader('p2'),
    });
    expectDecision(g, 'block', 'p2');
  });
});
