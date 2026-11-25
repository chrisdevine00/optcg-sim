/**
 * PRB02-004 Jewelry Bonney (Character, cost 3, 3000, Counter +1000, {Bonney Pirates}/{Supernovas},
 * [Blocker]).
 *
 * Card text: "[Blocker] [On Your Opponent's Attack] [Once Per Turn] Set up to 1 of your DON!! cards as
 * active."
 *
 * Rules: [On Your Opponent's Attack] activates when the opponent declares an attack (CR 10-2-x), on
 * the Attack Step before the Block Step; it never activates for my own attacks. Setting a rested
 * DON!! as active returns it to the active state in the cost area. "Up to 1" may be answered with 0
 * (the count question: most first, "None" last, like "add up to N DON!!"). Once Per Turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  decision,
  donStr,
  kind,
  kw,
  LDP,
  mine,
  need,
  SP,
  theirs,
  chr,
} from './kit-prb02sta.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BO = 'PRB02-004';

function theirBoard(
  p1chars: (string | { card: string; rested?: boolean })[],
  rested = 3,
  active = 0,
  p2chars: string[] = [],
) {
  return theirs(
    LDP.neutral,
    { characters: p1chars, costArea: { active, rested } },
    { characters: p2chars },
  );
}

/** Answer the DON!! count question with `n` ("1" = set one, "0" = None). */
function count(g: TestGame, n: 0 | 1) {
  const d = need(g, 'choose', 'p1');
  expect(d.purpose).toBe('mode');
  act(g, { type: 'pick', choice: { option: String(n) } });
}

describe("PRB02-004 Jewelry Bonney: [Blocker]; [On Your Opponent's Attack] [Once Per Turn] set up to 1 DON!! as active", () => {
  it('printed values: cost 3, 3000 power, Counter +1000, [Blocker]', () => {
    const g = theirBoard([BO]);
    const i = at(g, 'p1', 'characters', BO);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([3, 3000, 1000]);
    expect(kw(g, i)).toContain('Blocker');
  });

  it('when the opponent attacks my Leader: setting 1 rested DON!! active (rested 3 -> 2, active 0 -> 1)', () => {
    const g = theirBoard([BO]);
    attack(g, g.leader('p2'), g.leader('p1'));
    count(g, 1);
    expect(donStr(g, 'p1')).toBe('1/2/0');
    expect(kind(g)).toBe('block');
  });

  it('"up to 1": answering None changes no DON!!', () => {
    const g = theirBoard([BO]);
    attack(g, g.leader('p2'), g.leader('p1'));
    count(g, 0);
    expect(donStr(g, 'p1')).toBe('0/3/0');
    expect(kind(g)).toBe('block');
  });

  it('only 1 DON!! is set even with 3 rested', () => {
    const g = theirBoard([BO], 3, 2);
    attack(g, g.leader('p2'), g.leader('p1'));
    count(g, 1);
    expect(donStr(g, 'p1')).toBe('3/2/0');
  });

  it('with no rested DON!! nothing can change (all 3 already active)', () => {
    const g = theirBoard([BO], 0, 3);
    attack(g, g.leader('p2'), g.leader('p1'));
    if (kind(g) === 'choose') count(g, 0);
    expect(donStr(g, 'p1')).toBe('3/0/0');
    expect(kind(g)).toBe('block');
  });

  it('it also triggers when the opponent attacks one of my Characters, not only the Leader', () => {
    const g = theirBoard([BO, { card: SP.c1p3, rested: true }]);
    attack(g, g.leader('p2'), at(g, 'p1', 'characters', SP.c1p3));
    count(g, 1);
    expect(donStr(g, 'p1')).toBe('1/2/0');
  });

  it('[Once Per Turn]: the second attack of the same turn does not set another DON!!', () => {
    const g = theirBoard([BO], 3, 0, [SP.c2p4]);
    attack(g, g.leader('p2'), g.leader('p1'));
    count(g, 1);
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    for (let i = 0; i < 4 && decision(g)?.kind === 'trigger'; i++)
      act(g, { type: 'trigger', activate: false });
    need(g, 'main', 'p2');
    attack(g, chr(g, 'p2', SP.c2p4), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(donStr(g, 'p1')).toBe('1/2/0');
  });

  it('it never triggers on my own attack', () => {
    const g = mine(LDP.neutral, { characters: [BO], costArea: { active: 0, rested: 3 } });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(decision(g)?.player).toBe('p2');
    expect(kind(g)).toBe('block');
    expect(donStr(g, 'p1')).toBe('0/3/0');
  });

  it('a rested Bonney still has the effect (it needs to be on the field, not active)', () => {
    const g = theirBoard([{ card: BO, rested: true }]);
    attack(g, g.leader('p2'), g.leader('p1'));
    count(g, 1);
    expect(donStr(g, 'p1')).toBe('1/2/0');
  });

  it('[Blocker] still works afterwards: Bonney can block the attack that triggered the effect', () => {
    const g = theirBoard([BO]);
    attack(g, g.leader('p2'), g.leader('p1'));
    count(g, 1);
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', BO)]);
  });
});
