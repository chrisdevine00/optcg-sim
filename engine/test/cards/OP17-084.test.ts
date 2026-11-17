/** OP17-084 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { GIANT } from './helpers-sabo.ts';

describe('OP17-084 Tony Tony.Chopper', () => {
  const setup = (chars: string[], opp: string[] = []) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-084'],
        characters: chars,
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it('[On Play]: with a cost 12+ Character, up to 1 of your Characters gains [Unblockable] this turn', () => {
    const g = setup([GIANT, V.c3]);
    play(g, 'OP17-084');
    // The offered Characters are yours only, and include the new Chopper.
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered).toHaveLength(3);
    const target = g.find('p1', 'characters', V.c3);
    pick(g, [target]);
    expect(g.card(target).keywords).toContain('Unblockable');
    expect(g.card(g.find('p1', 'characters', GIANT)).keywords).not.toContain('Unblockable');
    g.act({ type: 'endTurn' });
    expect(g.card(target).keywords).not.toContain('Unblockable');
  });

  it('[On Play]: the cost 12 Character may be the opponent\'s ("there is a Character")', () => {
    const g = setup([V.c3], [GIANT]);
    play(g, 'OP17-084');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', 'OP17-084')]);
    expect(g.card(g.find('p1', 'characters', 'OP17-084')).keywords).toContain('Unblockable');
  });

  it('[On Play]: "up to 1" may be declined', () => {
    const g = setup([GIANT]);
    play(g, 'OP17-084');
    none(g);
    expect(g.card(g.find('p1', 'characters', GIANT)).keywords).not.toContain('Unblockable');
  });

  it('[On Play]: with no cost 12+ Character nothing happens and no decision is asked', () => {
    const g = setup([V.c3]);
    play(g, 'OP17-084');
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p1', 'characters', V.c3)).keywords).not.toContain('Unblockable');
  });
});
