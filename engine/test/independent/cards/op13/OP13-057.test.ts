/**
 * OP13-057 If I Bowed Down to Power, What's the Point in Living? (Event, Blue, cost 1,
 * {Whitebeard Pirates}).
 *
 * Card text: "[Main] You may rest 1 of your DON!! cards: If you have 1 or less Life cards, your
 * opponent cannot activate [Blocker] whenever your Leader attacks during this turn.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (cost before the colon; paying it is the player's choice, "you may"), digest
 * 120 (the cost is paid even if the "If" then fails), digest 72 ("during this turn" ends in the
 * End Phase), CR 7-1 / digest 97 ("during this battle" ends at the End of the Battle).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  blockers,
  canCounterWith,
  decision,
  dons,
  isMain,
  mine,
  need,
  no,
  passBlock,
  playRaw,
  theirs,
  toMyNextMain,
  unusable,
  useCounter,
  WL,
  WV,
  yes,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BOWED = 'OP13-057';
const FRANKY_BLOCKER = 'OP09-072'; // Purple, cost 4, 5000, [Blocker]

function board(life: number, active = 5, mineChars: string[] = []): TestGame {
  return mine(
    WL.croc,
    {
      hand: [BOWED],
      life: Array.from({ length: life }, () => BLUE),
      costArea: { active, rested: 0 },
      characters: mineChars,
    },
    { characters: [FRANKY_BLOCKER] },
  );
}

function bow(g: TestGame): void {
  playRaw(g, BOWED);
  yes(g);
}

describe('OP13-057 If I Bowed Down to Power: [Main] with 1 or less Life, no [Blocker] against my Leader; [Counter] Leader +3000', () => {
  it('1 Life (boundary): after paying, the opponent cannot block my Leader', () => {
    const g = board(1);
    bow(g);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('0 Life: also works', () => {
    const g = board(0);
    bow(g);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('2 Life (boundary): the cost is paid but the opponent can still block', () => {
    const g = board(2);
    bow(g);
    expect(dons(g).rested).toBe(2); // the Event itself (1) and the DON!! cost (1)
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', FRANKY_BLOCKER)]);
  });

  it('"you may": declining the cost does nothing, even with 1 Life', () => {
    const g = board(1);
    playRaw(g, BOWED);
    no(g);
    expect(dons(g).rested).toBe(1);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('pays exactly 1 extra DON!! (rested) on top of the Event cost', () => {
    const g = board(1);
    bow(g);
    expect(dons(g)).toMatchObject({ active: 3, rested: 2 });
    expect(isMain(g)).toBe(true);
  });

  it('unpayable cost: with only 1 active DON!! (spent on the Event) the effect cannot be used', () => {
    const g = board(1, 1);
    playRaw(g, BOWED);
    unusable(g);
    need(g, 'main', 'p1');
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it("only my Leader's attacks: a Character attack can still be blocked", () => {
    const g = board(1, 5, [WV.thatch]);
    bow(g);
    attack(g, g.find('p1', 'characters', WV.thatch), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', FRANKY_BLOCKER)]);
  });

  it('lasts for the turn and ends with it: next turn the Blocker works again', () => {
    const g = board(1);
    bow(g);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('the Event is only used once: it is trashed after resolving', () => {
    const g = board(1);
    bow(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([BOWED]);
  });
});

describe('OP13-057 [Counter]: my Leader gains +3000 power during this battle', () => {
  function defend(life = 4): TestGame {
    const g = theirs(
      WL.croc,
      {
        hand: [BOWED],
        costArea: { active: 3, rested: 0 },
        life: Array.from({ length: life }, () => BLUE),
      },
      { characters: [WV.jil] },
    );
    attack(g, g.find('p2', 'characters', WV.jil), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('can be used in the Counter Step, costs 1 and makes my Leader 8000 for the battle', () => {
    const g = defend();
    expect(canCounterWith(g, g.find('p1', 'hand', BOWED))).toBe(true);
    useCounter(g, g.find('p1', 'hand', BOWED), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(dons(g).rested).toBe(1);
  });

  it('6000 attacker against 8000 Leader: no damage', () => {
    const g = defend();
    useCounter(g, g.find('p1', 'hand', BOWED), g.leader('p1'));
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('without it the same 6000 attack beats my 5000 Leader (control)', () => {
    const g = defend();
    act(g, { type: 'endCounter' });
    expect(decision(g)?.kind).toBe('trigger');
  });

  it('the bonus ends with the battle: the Leader is back to 5000', () => {
    const g = defend();
    useCounter(g, g.find('p1', 'hand', BOWED), g.leader('p1'));
    act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('works with more than 1 Life too (no Life condition on the [Counter])', () => {
    const g = defend(5);
    expect(canCounterWith(g, g.find('p1', 'hand', BOWED))).toBe(true);
  });
});
