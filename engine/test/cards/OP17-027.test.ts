/** OP17-027 Benn.Beckman. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, PLAIN_BLUE, pick, play, V } from './helpers.ts';
import { OTHER_LEADER, SHANKS_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-027';

describe('OP17-027 Benn.Beckman', () => {
  const start = (leader: string) =>
    game(
      { leader, hand: [ID], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1, V.c2, V.c3] },
    );

  it('has [Rush: Character]: it can attack a Character the turn it is played, not the Leader', () => {
    const g = start(SHANKS_LEADER);
    const benn = play(g, ID);
    none(g);
    expect(g.card(benn).keywords).toContain('Rush: Character');
    const targets = g
      .legal()
      .flatMap((a) => (a.type === 'attack' && a.attacker === benn ? [a.target] : []));
    expect(targets).not.toContain(g.leader('p2'));
  });

  it('[On Play]: with a {Red-Haired Pirates} Leader, draw 1 card and rest up to 2 opponent Characters (any cost)', () => {
    const g = start(SHANKS_LEADER);
    play(g, ID);
    const a = g.find('p2', 'characters', V.c1);
    const b = g.find('p2', 'characters', V.c3);
    pick(g, [a, b]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.card(a).rested).toBe(true);
    expect(g.card(b).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('"up to 2": may rest only 1, or none, and still draws', () => {
    const g = start(SHANKS_LEADER);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(1);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('with a Leader that is not {Red-Haired Pirates}: no draw and nothing rested', () => {
    const g = start(OTHER_LEADER);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });
});
