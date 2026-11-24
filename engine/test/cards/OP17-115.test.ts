/** OP17-115 Don't you know that even in the cruel world of pirates there's still a code of honor?!! */
import { describe, expect, it } from 'vitest';
import {
  decline,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  takeDamage,
  V,
} from './helpers.ts';
import { LINLIN } from './helpers-op17g3.ts';

const ID = 'OP17-115';

describe("OP17-115 Don't you know that even in the cruel world of pirates there's still a code of honor?!!", () => {
  const main = (leader: string) =>
    game(
      { leader, hand: [ID], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: ['OP17-072'] },
    );

  it('[Main] your [Charlotte Linlin] Leader gains [Unblockable] during this turn', () => {
    const g = main(LINLIN);
    expect(g.card(g.leader('p1')).keywords).not.toContain('Unblockable');
    play(g, ID);
    // No "up to": the grant needs no choice.
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).keywords).toContain('Unblockable');
  });

  it('the Unblockable Leader cannot be blocked, then the grant ends with the turn', () => {
    const g = main(LINLIN);
    play(g, ID);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    // p2 owns a [Blocker] (Black Maria; her own [On Your Opponent's Attack] is declined) but may not
    // use it: the only legal answer to the block decision is not to block.
    decline(g);
    expectDecision(g, 'block', 'p2');
    expect(g.legal().filter((a) => a.type === 'block' && a.blocker !== null)).toHaveLength(0);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    g.act({ type: 'endTurn' });
    expect(g.card(g.leader('p1')).keywords).not.toContain('Unblockable');
  });

  it('with a Leader not named [Charlotte Linlin] nothing is granted', () => {
    const g = main(PLAIN_PURPLE);
    play(g, ID);
    expect(g.card(g.leader('p1')).keywords).not.toContain('Unblockable');
  });

  const counter = (leader: string) => {
    const g = game(
      { leader, hand: [ID], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', ID), ability: 'counter' });
    return g;
  };

  it('[Counter] up to 1 of your [Charlotte Linlin] gains +4000 power during this battle', () => {
    const g = counter(LINLIN);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 stops the 8000 attacker
  });

  it('[Counter] "up to 1": may choose nothing; and a Leader not named [Charlotte Linlin] is not a target', () => {
    const a = counter(LINLIN);
    none(a);
    expect(a.power(a.leader('p1'))).toBe(5000);

    const b = counter(PLAIN_PURPLE);
    // No [Charlotte Linlin] on the field: no target to choose.
    expect(b.power(b.leader('p1'))).toBe(5000);
  });
});
