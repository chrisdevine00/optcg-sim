/** ST30-001 Luffy & Ace. RL-49 (QA-ST30 ST30-001, two rows). */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { game, PLAIN_BLUE, BLUE } from './helpers.ts';
import { ACE, LUFFY_C, SHC } from './helpers-luffyace.ts';

const LEADER = 'ST30-001';
const opp = { leader: PLAIN_BLUE };

describe('ST30-001 Luffy & Ace', () => {
  it('QA-ST30 row 1: with no Character of 7000 base power or more there is no -2000', () => {
    const g = game({ leader: LEADER }, opp);
    expect(g.power(g.leader('p1'))).toBe(6000);
    const small = game({ leader: LEADER, characters: [LUFFY_C, SHC.franky4] }, opp);
    expect(small.power(small.leader('p1'))).toBe(6000);
  });

  it('with a Character of 7000 base power or more the Leader gets -2000, and it follows the board', () => {
    const on = game({ leader: LEADER, characters: [SHC.franky5] }, opp);
    expect(on.power(on.leader('p1'))).toBe(4000);
    // The condition is read live: the Character leaves, the -2000 goes (CR 8-1-3-3).
    on.state = applyOp(on.state, {
      op: 'trashFromField',
      card: on.find('p1', 'characters', SHC.franky5),
      by: 'p2',
    }).state;
    expect(on.power(on.leader('p1'))).toBe(6000);
  });

  it('the condition reads base power: a 6000 Character boosted to 8000 does not switch it on', () => {
    const g = game({ leader: LEADER, characters: [LUFFY_C] }, opp);
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target: g.find('p1', 'characters', LUFFY_C),
        amount: 2000,
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p1',
      },
    }).state;
    expect(g.power(g.find('p1', 'characters', LUFFY_C))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it("[Opponent's Turn]: your [Portgas.D.Ace] and [Monkey.D.Luffy] cards gain +3000, and no others", () => {
    const g = game(
      { leader: LEADER, characters: [LUFFY_C, ACE, SHC.franky4] },
      { leader: PLAIN_BLUE, characters: [BLUE] },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(g.power(g.find('p1', 'characters', LUFFY_C))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', ACE))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', SHC.franky4))).toBe(6000);
  });

  it('on your own turn the named cards stay at their printed power', () => {
    const g = game({ leader: LEADER, characters: [LUFFY_C, ACE] }, opp);
    expect(g.power(g.find('p1', 'characters', LUFFY_C))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', ACE))).toBe(6000);
  });

  it('QA-ST30 row 2: the Leader itself ("Luffy & Ace") gets no +3000 on the opponent\'s turn', () => {
    const g = game({ leader: LEADER }, opp, { turn: 4, activePlayer: 'p2' });
    expect(g.power(g.leader('p1'))).toBe(6000);
    // Both effects together on the opponent's turn: -2000 from the big Character, no boost.
    const both = game({ leader: LEADER, characters: [SHC.franky5] }, opp, {
      turn: 4,
      activePlayer: 'p2',
    });
    expect(both.power(both.leader('p1'))).toBe(4000);
  });
});
