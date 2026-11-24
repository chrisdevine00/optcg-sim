/** OP01-120 Shanks. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';
import { BLOCKER_2000, BLOCKER_3000, WB_LEADER } from './helpers-stg2.ts';

const ID = 'OP01-120';
const canBlock = (g: ReturnType<typeof game>, blocker: string) =>
  g.legal().some((a) => a.type === 'block' && a.blocker === blocker);

const attack = (opp: string[]) => {
  const g = game(
    { leader: WB_LEADER, characters: [ID] },
    { leader: PLAIN_BLUE, characters: opp.map((card) => ({ card })) },
  );
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('OP01-120 Shanks', () => {
  it('has [Rush] and can attack the turn it is played', () => {
    const g = game(
      { leader: WB_LEADER, hand: [ID], costArea: { active: 9, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    const c = g.find('p1', 'characters', ID);
    expect(g.card(c).keywords).toContain('Rush');
    expect(g.isLegal({ type: 'attack', attacker: c, target: g.leader('p2'), player: 'p1' })).toBe(
      true,
    );
  });

  it('[When Attacking] a [Blocker] with 2000 power (boundary) cannot be activated this battle', () => {
    const g = attack([BLOCKER_2000]);
    expectDecision(g, 'block', 'p2');
    expect(canBlock(g, g.find('p2', 'characters', BLOCKER_2000))).toBe(false);
    passBlock(g);
  });

  it('a [Blocker] with 3000 power can still block', () => {
    const g = attack([BLOCKER_3000]);
    expectDecision(g, 'block', 'p2');
    expect(canBlock(g, g.find('p2', 'characters', BLOCKER_3000))).toBe(true);
  });

  it('only the weak Blocker is locked when both are present', () => {
    const g = attack([BLOCKER_2000, BLOCKER_3000]);
    expect(canBlock(g, g.find('p2', 'characters', BLOCKER_2000))).toBe(false);
    expect(canBlock(g, g.find('p2', 'characters', BLOCKER_3000))).toBe(true);
  });

  it('the restriction ends with the battle: the same Blocker may block the next attack', () => {
    const g = game(
      { leader: WB_LEADER, characters: [ID, V.c3] },
      { leader: PLAIN_BLUE, characters: [BLOCKER_2000] },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    passBlock(g);
    g.act({ type: 'endCounter' });
    while (g.decider === 'p2') g.act({ type: 'trigger', activate: false });
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', V.c3),
      target: g.leader('p2'),
    });
    expect(canBlock(g, g.find('p2', 'characters', BLOCKER_2000))).toBe(true);
  });
});
