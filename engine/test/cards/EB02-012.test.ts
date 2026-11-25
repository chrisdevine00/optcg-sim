/** EB02-012 Gaimon. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { C1, expectDecision } from './helpers-aeb2g1.ts';
import { game, PLAIN_BLUE, V } from './helpers.ts';

const ID = 'EB02-012';
const SARF = 'EB02-014';

const canBlock = (g: TestGame): boolean =>
  g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID));
const blocker = (g: TestGame): boolean =>
  g.card(g.find('p1', 'characters', ID)).keywords.includes('Blocker');

/** p2's Character attacks p1's Leader and p1 owes the block decision. */
function attacked(p1chars: string[], p1hand: string[] = [], p2chars: string[] = [V.c4]): TestGame {
  const g = game(
    { leader: 'ST01-001', characters: p1chars, hand: p1hand },
    { leader: PLAIN_BLUE, characters: p2chars },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
  expectDecision(g, 'block', 'p1');
  return g;
}

describe('EB02-012 Gaimon', () => {
  it('with a [Sarfunkel] on your field it has [Blocker] and can block', () => {
    const g = attacked([ID, SARF]);
    expect(blocker(g)).toBe(true);
    expect(canBlock(g)).toBe(true);
  });

  it('without a [Sarfunkel] it has no [Blocker] and cannot block', () => {
    const g = attacked([ID, C1]);
    expect(blocker(g)).toBe(false);
    expect(canBlock(g)).toBe(false);
  });

  it("a [Sarfunkel] in your hand, or on the opponent's field, does not count", () => {
    const g = attacked([ID], [SARF], [V.c4, SARF]);
    expect(blocker(g)).toBe(false);
    expect(canBlock(g)).toBe(false);
  });

  it('the [Blocker] ends when the [Sarfunkel] leaves the field', () => {
    const g = game(
      { leader: 'ST01-001', characters: [ID, SARF] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(blocker(g)).toBe(true);
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', SARF),
      by: 'p2',
    }).state;
    expect(blocker(g)).toBe(false);
  });
});
