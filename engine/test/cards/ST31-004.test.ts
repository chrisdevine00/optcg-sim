/** ST31-004 Monkey.D.Luffy. The text's "-1000" was restored from the official page (data-sources.md fix 56). */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, play, V } from './helpers.ts';
import { PLAIN_BLUE, RGL, SHC3, SHC6 } from './helpers-rgl-penel.ts';

describe('ST31-004 Monkey.D.Luffy', () => {
  it('[On Play]: -1000 per {Straw Hat Crew} card on your field (Leader, Characters, itself), each to up to 1 chosen Character', () => {
    const g = game(
      {
        leader: RGL,
        hand: ['ST31-004'],
        characters: [SHC3, SHC6, V.c4],
        costArea: { active: 7, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c5] },
    );
    play(g, 'ST31-004');
    // Leader + 2 Straw Hat Crew Characters + Luffy = 4 repetitions.
    const c3 = g.find('p2', 'characters', V.c3);
    const c5 = g.find('p2', 'characters', V.c5);
    pick(g, [c3]);
    pick(g, [c3]);
    pick(g, [c5]);
    pick(g, [c5]);
    expect(g.power(c3)).toBe(5000 - 2000);
    expect(g.power(c5)).toBe(7000 - 2000);
    expectDecision(g, 'main', 'p1');
  });

  it('with no opposing Character it does nothing', () => {
    const g = game(
      { leader: RGL, hand: ['ST31-004'], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'ST31-004');
    expectDecision(g, 'main', 'p1');
  });

  it('a repetition may be skipped ("up to 1")', () => {
    const g = game(
      { leader: RGL, hand: ['ST31-004'], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    play(g, 'ST31-004');
    const c3 = g.find('p2', 'characters', V.c3);
    pick(g, [c3]);
    g.act({ type: 'done' });
    // Leader + Luffy = 2 repetitions: one used, one skipped.
    expect(g.power(c3)).toBe(4000); // 5000 - 1000
  });

  const withGiven = (given: number) =>
    game(
      {
        leader: { card: RGL, don: given },
        hand: ['ST31-004'],
        costArea: { active: 7, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
  const canAttack = (g: ReturnType<typeof withGiven>, id: string) =>
    g.isLegal({ type: 'attack', attacker: id, target: g.leader('p2'), player: 'p1' });

  it('gains [Rush] with a total of 3 or more given DON!! cards', () => {
    const g = withGiven(3);
    const id = play(g, 'ST31-004');
    expect(canAttack(g, id)).toBe(true);
  });

  it('with 2 given DON!! it has no [Rush]', () => {
    const g = withGiven(2);
    const id = play(g, 'ST31-004');
    expect(canAttack(g, id)).toBe(false);
  });
});
