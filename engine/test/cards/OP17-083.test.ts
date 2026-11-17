/** OP17-083 Jinbe. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { BLUE, expectDecision, game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { expectBigCondition, GIANT } from './helpers-sabo.ts';

describe('OP17-083 Jinbe', () => {
  it('+3000 power while a Character with a cost of 12 or more exists', () => {
    expectBigCondition('OP17-083', (g, id) => g.power(id), 2000, 5000);
  });

  it('gains [Blocker] only while such a Character exists', () => {
    expectBigCondition('OP17-083', (g, id) => g.card(id).keywords.includes('Blocker'), false, true);
  });

  const attacked = (p1Chars: string[]) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: p1Chars, life: [BLUE, BLUE, BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
    expectDecision(g, 'block', 'p1');
    return g;
  };
  const blockersOf = (g: ReturnType<typeof attacked>) =>
    g.legal().flatMap((a) => (a.type === 'block' && a.blocker ? [a.blocker] : []));

  it('can block an attack while a cost 12 Character exists', () => {
    const g = attacked(['OP17-083', GIANT]);
    expect(blockersOf(g)).toContain(g.find('p1', 'characters', 'OP17-083'));
    // Saul itself has no [Blocker].
    expect(blockersOf(g)).not.toContain(g.find('p1', 'characters', GIANT));
  });

  it('cannot block without one', () => {
    const g = attacked(['OP17-083']);
    expect(blockersOf(g)).toEqual([]);
  });

  it('when the big Character leaves the field, it loses [Blocker] and the power again', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: ['OP17-083', GIANT] },
      { leader: PLAIN_BLUE },
    );
    const jinbe = g.find('p1', 'characters', 'OP17-083');
    expect(g.power(jinbe)).toBe(5000);
    expect(g.card(jinbe).keywords).toContain('Blocker');
    g.state = applyOp(g.state, {
      op: 'trashFromField',
      card: g.find('p1', 'characters', GIANT),
      by: 'p2',
    }).state;
    expect(g.power(jinbe)).toBe(2000);
    expect(g.card(jinbe).keywords).not.toContain('Blocker');
  });
});
