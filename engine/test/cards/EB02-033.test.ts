/** EB02-033 Klabautermann. */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../fixtures/index.ts';
import { expectDecision, MERRY, ZOU } from './helpers-aeb2g1.ts';
import { game, PLAIN_BLUE, V } from './helpers.ts';

const ID = 'EB02-033';

const blocker = (g: TestGame): boolean =>
  g.card(g.find('p1', 'characters', ID)).keywords.includes('Blocker');
const canBlock = (g: TestGame): boolean =>
  g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID));

/** p2's Character attacks p1's Leader: p1 owes the block decision. */
function attacked(stage: string | undefined, p2stage?: string): TestGame {
  const g = game(
    { leader: 'ST01-001', characters: [ID], ...(stage ? { stage } : {}) },
    { leader: PLAIN_BLUE, characters: [V.c4], ...(p2stage ? { stage: p2stage } : {}) },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
  expectDecision(g, 'block', 'p1');
  return g;
}

describe('EB02-033 Klabautermann', () => {
  it('with [Merry Go] on your field it has [Blocker] and can block', () => {
    const g = attacked(MERRY);
    expect(blocker(g)).toBe(true);
    expect(canBlock(g)).toBe(true);
  });

  it('without a Stage it has no [Blocker]', () => {
    const g = attacked(undefined);
    expect(blocker(g)).toBe(false);
    expect(canBlock(g)).toBe(false);
  });

  it('another Stage (not named [Merry Go]) does not give it', () => {
    const g = attacked(ZOU);
    expect(blocker(g)).toBe(false);
  });

  it("the opponent's [Merry Go] does not count", () => {
    const g = attacked(undefined, MERRY);
    expect(blocker(g)).toBe(false);
  });

  it('any card named [Merry Go] counts (the red and the yellow ones too)', () => {
    for (const merry of ['P-142', 'EB02-060']) {
      const g = attacked(merry);
      expect(blocker(g)).toBe(true);
    }
  });
});
