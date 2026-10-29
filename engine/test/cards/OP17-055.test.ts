/** OP17-055 There's No Authority in the World That Lasts Forever!!! */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, passBlock, pick, play, PLAIN_PURPLE, ROCKS, V } from './helpers.ts';

describe('OP17-055', () => {
  it('[Main] rest 1 DON!!: [Rocks.D.Xebec] gains [Unblockable], so no [Blocker] is offered', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-055'], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: ['OP09-072'] },
    );
    play(g, 'OP17-055');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).keywords).toContain('Unblockable');
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
    expectDecision(g, 'block', 'p2');
    expect(g.legal().filter((a) => a.type === 'block' && a.blocker !== null)).toEqual([]);
  });

  it('[Main] needs 1 active DON!!', () => {
    const g = game({ leader: ROCKS, hand: ['OP17-055'] }, { leader: PLAIN_PURPLE });
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false);
  });

  it('[Counter]: activated in the Counter Step, +2000 to a "Rocks Pirates" Leader', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-055'] },
      { leader: PLAIN_PURPLE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    passBlock(g);
    const ev = g.find('p1', 'hand', 'OP17-055');
    g.act({ type: 'activate', card: ev, ability: 'counter' });
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expectDecision(g, 'counter', 'p1');
  });
});
